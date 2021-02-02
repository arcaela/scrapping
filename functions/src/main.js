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
    const row = snap.data();
    const step = Math.ceil(row.CC / 100000);
    const ranges = [
        ((step*100000)-100000)+1,
        (step * 100000),
    ];
    return Logs.cc.update({
        counts:admin.firestore.FieldValue.increment(1),
        last:{
            cc:row,
            ago:admin.firestore.FieldValue.serverTimestamp(),
        },
        [ranges.join('_')]:{
            last:row,
            ago:admin.firestore.FieldValue.serverTimestamp(),
        },
    });
});