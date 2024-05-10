

const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { RunTaskCommand, ECSClient } = require('@aws-sdk/client-ecs');
const Redis = require('ioredis');
const { Server } = require('socket.io');

const PORT = 9000;
const app = express();

const subscriber = new Redis('');

const io = new Server({ cors : '*'});

io.on('connection', socket => {
  socket.on('subscribe', channel => {
    socket.join(channel);
    io.emit('message', `Joined to ${channel}`)
  })
})
io.listen(9001 , () => console.log('Socket Server is ruuning on 9001') )

const ecsClient = new ECSClient({
  region: '',
  credentials: {
    accessKeyId: '',
    secretAccessKey:''
  }
})
const config = {
  CLUSTER: '',
  TASK : ''
}
app.use(express.json());

app.post('/project', async(req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug? slug :  generateSlug();

  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ['', '', ''],
        securityGroups: [''],
        assignPublicIp: 'ENABLED'
      }
    },
    overrides: {
      containerOverrides :[ 
        {
          name: 'builder-image',
          environment: [
            { name: 'GIT_REPOSITORY_URL', value: gitURL},
            { name: 'PROJECT_ID', value: projectSlug}
          ]
        }
      ]
    }
  })

  await ecsClient.send(command);
  return res.json({ status: 'queued', data: {projectSlug, url: `http://${projectSlug}/localhost:8000`}});
});

async function initRedisSubscriber()  {
  console.log('Subscribed to Logs');
  subscriber.psubscribe('logs:*');
  subscriber.on('pmessage', (pattern, channel, message) => {
    io.to(channel).emit('message', message)
  })
}
initRedisSubscriber()

app.listen(PORT , () => console.log("Api Server Running.. on 9000"));