// import Depndencies
const Document = require("./Document")
const mongoose = require("mongoose")

// load env variables 
const dotenv = require("dotenv")
dotenv.config()

// setup mongo database url
const DB_URL = process.env.DB_URL

// start server on port
const SERVER_PORT = 3001

// starter text for new document 
const defaultDocumentData = ""


// Establish connection with 
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(() => {
    console.log("db connection succesfull")
})
    .catch(err => {
        console.log("db not connected")

    })


// start socket.io server 
const io = require('socket.io')(SERVER_PORT, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
    }
})



// watch on events
io.on("connection", socket => {
    socket.on("get-document", async (documentId) => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit('load-document', document.data)

        socket.on('send-changes', delta => {
            socket.broadcast.emit("recieve-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })

    })
})


// create new document if id does not exist
async function findOrCreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({
        _id: id,
        data: defaultDocumentData
    })
}