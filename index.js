//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(process.env.MONGO_URI);
mongoose.set("strictQuery", false);

const itemsSchema = { name: String };
const listsSchema = { name: String, items: [itemsSchema] };

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listsSchema);

let itemsArray = [];

const item1 = new Item({
  name: "Play a game",
});

const item2 = new Item({
  name: "Complete the course",
});

const item3 = new Item({
  name: "Play another one",
});

let day;

app.get("/", function (req, res) {
  buttonValue = "home";
  day = date.getDate();

  Item.find().then((data) => {
    itemsArray = data;

    if (itemsArray.length === 0) {
      itemsArray = [item1, item2, item3];
      Item.insertMany(itemsArray);
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: itemsArray,
      });
    }
  });
});

app.post("/", function (req, res) {
  let listname = req.body.list;

  const newitem = new Item({
    name: req.body.newItem,
  });

  if (listname === day) {
    newitem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listname }).then((data) => {
      data.items.push(newitem);
      data.save();
      res.redirect("/" + listname);
    });
  }
});

app.post("/deleted", (req, res) => {
  checkedId = req.body.checkbox;
  listname = req.body.listName;

  if (listname === day) {
    Item.findByIdAndDelete({ _id: checkedId }).then(() => {
      res.redirect("/");
    });
  } else {
    List.updateOne(
      { name: listname },
      { $pull: { items: { _id: checkedId } } }
    ).then(() => {
      res.redirect("/" + listname);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:customName", function (req, res) {
  let heading = req.params.customName;

  List.findOne({ name: heading }).then((data) => {
    if (!data) {
      const list1 = new List({
        name: heading,
        items: itemsArray,
      });

      list1.save();
      res.redirect("/" + heading);
    } else {
      res.render("list", {
        listTitle: heading,
        newListItems: data.items,
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port: 3000");
});
