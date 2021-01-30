const {
    Logs,
    functions,
    admin,
} = require('./firebase');

// cronJobs
// exports.cronJobsCountCC = functions.pubsub.schedule('every 1 minutes')
// .onRun(()=>Firestore.collection('CC').get().then(snap=>Logs.cc.update({
//     counts:snap.docs.length,
// })))

// onCreate
exports.onCreateCC = functions.firestore.document('CC/{cedula}').onCreate((snap)=>{
    return Logs.cc.update({
        counts:admin.firestore.FieldValue.increment(1),
        last:snap.data().CC,
    });
});