
This code is referenced in the following articles: Please read these
articles for more information.

  lambdash: AWS Lambda Shell Hack: New And Improved!
  https://alestic.com/2015/06/aws-lambda-shell-2/

  Exploring The AWS Lambda Runtime Environment
  https://alestic.com/2014/11/aws-lambda-environment/ 

The files in this repo include:

  - index.js - AWS Lambda function that runs a provided shell command
    and returns stdout, stderr, and exit code.

  - lambdash - Command line program that invokes the AWS Lambda
    function with a specified shell command and outputs returned
    results.

  - lambdash.template - CloudFormation template that creates the AWS
    Lambda function and the required IAM role.

  - lambdash-install - Script to create the CLoudFormation stack.

  - lambdash-uninstall - Script to delete the CloudFormation stack.

  - lambdash-upload-s3 - Sample of how ZIP file and CloudFormation
    template were uploaded to the run.alestic.com S3 bucket
    (hardcoded names)

Note: This code is a simple hack, demonstrating a way to gain
visibility into the AWS Lambda environment. This is not intended to be
production quality software.
