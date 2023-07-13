const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dawimtn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const optionsCollection = client.db('foodFlow').collection('options')
        const bookingsCollection = client.db('foodFlow').collection('booking')

        app.get('/options', async (req, res) => {
            const date = req.query.date;
            // console.log(date);
            const query = {};
            const options = await optionsCollection.find(query).toArray();

            // get provided dates
            const bookingQuery = { bookingDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            // b 
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.table === option.name);

                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                // console.log(option.name, bookedSlots)
                // console.log(date, option.name, remainingSlots.length)
                option.slots = remainingSlots;
            })
            res.send(options);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                bookingDate: booking.bookingDate,
                email: booking.email,
                table: booking.table
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.bookingDate}`
                return res.send({ acknowledge: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);

            res.send(result);
        })

    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('food server is running')
})

app.listen(port, () => {
    console.log(`food server runing on ${port}`)
})