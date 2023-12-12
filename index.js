require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const { Schema } = mongoose;
const dns = require("dns");
const urlparser = require("url");

// db connection

mongoose.connect(process.env.MONGO_URI);
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number,
});
const Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint

app.post("/api/shorturl", async function (req, res) {
  // const url = req.body.url;

  const url = req.body.url;
  const urlObject = urlparser.parse(url);
  if (urlObject.protocol !== "http:" && urlObject.protocol !== "https:") {
    return res.json({ error: "invalid url" });
  } else {
    const options = {
      all: true,
    };

    // Calling dns.lookup() for hostname

    const dnsLookUp = dns.lookup(
      urlObject.hostname,
      options,
      async (err, addresses) => {
        if (!addresses) {
          res.json({ error: "invalid url" });
        } else {
          const urlCount = await Url.countDocuments({});
          const urlDoc = {
            original_url: url,
            short_url: urlCount + 1,
          };
          await Url.create(urlDoc);

          console.log(urlDoc);
          res.json({
            original_url: urlDoc.original_url,
            short_url: urlDoc.short_url,
          });
        }
      },
    );
  }
});
app.get("/api/shorturl/:short_url", async (req, res) => {
  const short_url = req.params.short_url;
  const url = await Url.findOne({ short_url: short_url });
  console.log(url);
  if (url) {
    res.redirect(url.original_url);
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
