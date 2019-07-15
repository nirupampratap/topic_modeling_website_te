zip -r9 ~/function.zip ~/myfunction/function.py
aws s3 cp ~/function.zip s3://nirupam-lambda-bucket
aws lambda update-function-code --function-name my-function --region us-east-1 --s3-bucket nirupam-lambda-bucket --s3-key function.zip

