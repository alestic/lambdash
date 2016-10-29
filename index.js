//
// lambdash - AWS Lambda function to run shell commands
//
// See also: https://alestic.com/2014/11/aws-lambda-shell/
//
process.env['PATH'] = process.env['PATH'] + ':' + process.cwd()
var AWS = require('aws-sdk');
var exec = require('child_process').exec;
var MAX_OUTPUT = 1024 * 1024 * 1024; // 1 GB
exports.handler = function(event, context) {
    var child = exec(event.command, {encoding: 'binary', maxBuffer: MAX_OUTPUT},
        function (error, stdout, stderr) {
            var result = {
                "stdout": new Buffer(stdout, 'binary').toString('base64'),
                "stderr": new Buffer(stderr, 'binary').toString('base64'),
                "error": error
            };
            context.succeed(result);
        }
    );
}
