const mongoose = require('mongoose')


const db = process.env.MONGO_URI
mongoose.set("strictQuery", false);

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('connected');
}).catch((err) => console.log(err));






