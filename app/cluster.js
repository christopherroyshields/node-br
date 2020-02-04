const cluster = require('cluster');
const
  workers = [],
  coreCount = require('os').cpus().length

var requestCount = 0

function startWorkers(workers){
  var worker = cluster.fork()
  worker.on("message", function(msg){
    if (msg.cmd==='started'){
      console.log(`Thread started with WSID ${msg.wsid.toString().padStart(2,0)}.`)
      workers[msg.wsid] = worker
      workers[msg.wsid].requestCount=0
      if (workers.length <= Math.min(coreCount, msg.concurrency)){
        startWorkers(workers)
      }
    }
    if (msg.cmd==='request'){
      requestCount += 1
      // console.log(`requestCount: ${requestCount}`);

      workers[msg.wsid].requestCount += 1
      // console.log(`WSID ${msg.wsid} handled ${workers[msg.wsid].requestCount} requests.`)
    }
  })
}

cluster.setupMaster({
  exec: 'api.js',
  silent: true
});

startWorkers(workers)
