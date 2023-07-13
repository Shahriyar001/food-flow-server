const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const optionsCollection = client.db('foodFlow').collection('options');
        const dishesCollection = client.db('foodFlow').collection('dishes');
        const bookingsCollection = client.db('foodFlow').collection('booking');
        const foodBookingsCollection = client.db('foodFlow').collection('foodBooking');
        const usersCollection = client.db('foodFlow').collection('users');
        const chefsCollection = client.db('foodFlow').collection('chefs');

        app.get('/options', async (req, res) => {
            const date = req.query.date;
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
                option.slots = remainingSlots;
            })
            res.send(options);
        });

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

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
        });

        app.get('/foodBooking', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const booking = await foodBookingsCollection.find(query).toArray();
            res.send(booking);
        })



        app.post('/foodBooking', async (req, res) => {
            const food = req.body;
            const result = await foodBookingsCollection.insertOne(food);
            res.send(result);
        })



        app.get('/dishes', async (req, res) => {
            const query = {};
            const dishes = await dishesCollection.find(query).toArray();
            res.send(dishes);
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);

        })

        app.get('/chefs', async (req, res) => {
            const query = {};
            const chefs = await chefsCollection.find(query).toArray();
            res.send(chefs);
        })

        app.post('/chefs', async (req, res) => {
            const chef = req.body;
            const result = await chefsCollection.insertOne(chef);
            res.send(result);
        })

        app.delete('/chefs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await chefsCollection.deleteOne(filter);
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