const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Redis = require('ioredis');


const s3Client = new S3Client({
  region:'',
  credentials : {
    accessKeyId: '',
    secretAccessKey: ''
  }
})

const publisher = new Redis('');

const PROJECT_ID = process.env.PROJECT_ID;

function publishLogs(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(log))
}

async function init() {
  publishLogs('Build Started..');
  const outputDir = path.join(__dirname, 'output');

  const p = exec(`cd ${outputDir} && npm install && npm run build`);
  
  p.stdout.on('data', function (data) {
    console.log('LOGS: ' + data.toString());
    publishLogs(data.toString());
  });
  p.stdout.on('error', function (data) {
    console.log('ERROR: ' + data.toString());
    publishLogs('ERROR: ' + data.toString());
  });

  p.on('close', async function () {
    console.log('Build Complete');
    publishLogs('Build Complete..')
    const distFolderPath = path.join(__dirname, 'output', 'dist');
    const distFolderContents = fs.readdirSync(distFolderPath);
    publishLogs('Upload Started..')
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if(fs.lstatSync(filePath).isDirectory()) continue;
      
      publishLogs('Uploading file:' + file)
      const command = new PutObjectCommand({
        Bucket: '',
        Key: `__output/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath)
      });
      await s3Client.send(command);
      publishLogs('Uploaded : ' + file)

    }
    publishLogs('Uploading Done');

  })
}

init();