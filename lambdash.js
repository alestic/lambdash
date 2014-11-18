//
// lambdash.js
//
// Lambda function for running shell commands in Lambda environment,
// saving output to S3 bucket or console log
//
// See also:
//   https://github.com/alestic/lambdash
//
// WARNING! This code should not be taken as a good example of
// anything. This is my first attempt at writing in JavaScript and in
// nodejs and therefore must have many beginner issues that you should
// not copy and propagate.
//

var AWS   = require('aws-sdk');
var async = require('async');
var fs    = require('fs');
var tmp   = require('tmp');
var spawn = require('child_process').spawn;

// Create temporary files for stdout and stderr
var _create_tmp_files = function(callback) {
    async.parallel({
        stdout: function(callback_stdout){
            tmp.file(function _tempFileCreated(err, path, fd) {
                callback_stdout(err, path);
            });
        },
        stderr: function(callback_stderr){
            tmp.file(function _tempFileCreated(err, path, fd) {
                callback_stderr(err, path);
            });
        }
    }, function(err, results) {
        callback(err, {
            stdout_path: results.stdout,
            stderr_path: results.stderr,
            stdout_stream: fs.createWriteStream(results.stdout, 'w'),
            stderr_stream: fs.createWriteStream(results.stderr, 'w')
        });
    });
};

// Run a command with stdout and stderr to files
var _run_command = function(command, args, options,
                            stdout_stream, stderr_stream, callback) {
    var child = spawn(command, args, options);
    child.stdout.on('data', function (data) {
        stdout_stream.write(data);
    });
    child.stderr.on('data', function (data) {
        stderr_stream.write(data);
    });
    child.on('close', function (code) {
        console.log('Exit code: ' + code);
        stdout_stream.end();
        stderr_stream.end();
        callback(null, '_run_command');
    });
}

// Upload single file to S3 bucket
var _upload_to_s3 = function(name, path, bucket, key, callback) {
    var s3bucket = new AWS.S3({params: {Bucket: bucket}});
    var readStream = fs.createReadStream(path);
    readStream.on('open', function () {
        var s3 = new AWS.S3();
        s3bucket.putObject({
            Key: key,
            Body: readStream,
            ContentType: 'text/plain',
            ACL: 'private',
            ServerSideEncryption: 'AES256'
        }, function(err, data) {
            var target = bucket + "/" + key;
            callback(err);
        });
    });
}

// Upload stdout and stderr files to S3
var _upload_all_to_s3 = function(stdout_path, stderr_path,
                                 bucket, stdout_key, stderr_key, callback) {
    async.parallel({
        stdout: function(callback) {
            _upload_to_s3('stdout', stdout_path, bucket, stdout_key,
                          function(err) {
                              callback(err, 'stdout');
                          });
        },
        stderr: function(callback) {
            _upload_to_s3('stderr', stderr_path, bucket, stderr_key,
                          function(err) {
                              callback(err, 'stderr');
                          });
        }
    }, function(err, results) {
        callback(err, '_upload_all_to_s3');
    });
};

// Run a command with stdout and stderr saved to S3
var _command = function(command, args, options,
                        bucket, stdout_key, stderr_key, callback) {
    var stdout_path, stderr_path, stdout_stream, stderr_stream;
    async.series([
        // Create temporary files for stdout, stderr
        function(callback) {
            _create_tmp_files(function(err, results) {
                if (err) throw err;
                stdout_path   = results.stdout_path;
                stderr_path   = results.stderr_path;
                stdout_stream = results.stdout_stream;
                stderr_stream = results.stderr_stream;
                callback(err, 'tmp');
            });

        // Run the command
        }, function(callback) {
            // Upload to S3 when writing of command output is done.
            stdout_stream.on('finish', function() {
                _upload_all_to_s3(stdout_path, stderr_path,
                                  bucket, stdout_key, stderr_key,
                                  function(err) {
                                      callback(err, 'run');
                                  });
            });
            _run_command(command, args, options,
                         stdout_stream, stderr_stream,
                         function(){});
        }
    ], function(err) {
        callback(err);
    });
};

// Main Lambda function handler
exports.handler = function(event, context) {
    var bucket     = event.bucket;
    var command    = event.command;
    var stdout_key = event.stdout;
    var stderr_key = event.stderr;
        
    console.log("command: " + command);
    _command('/bin/sh', ['-c', command], {},
             bucket, stdout_key, stderr_key,
             function(err) {
                 if (err) console.log('Error: ' + err);
                 context.done();
             }
    );
}
