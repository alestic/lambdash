//
// lambdash - AWS Lambda function to run shell commands
//
// See also: https://alestic.com/2014/11/aws-lambda-shell/
//
var AWS   = require('aws-sdk');
var exec = require('child_process').exec;
var MAX_OUTPUT = 1024 * 1024 * 1024; // 1 GB
var _command = function(command, callback) {
    var child = exec(command, {encoding: 'binary', maxBuffer: MAX_OUTPUT},
        function (error, stdout, stderr) {
            var result = {
                "stdout": new Buffer(stdout, 'binary').toString('base64'),
                "stderr": new Buffer(stderr, 'binary').toString('base64'),
                "code": error
            };
            callback(null, result);
        }
    );
}
exports.handler = function(event, context) {
    var command = event.command;
    _command(command, function(err, result) {
        if (err) {
            context.fail(err);
        } else {
            context.succeed(result);
        }
    });
}
