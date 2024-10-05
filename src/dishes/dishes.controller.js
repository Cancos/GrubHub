const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { ReadStream } = require("fs");

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function isLessThanZero(req, res, next) {
  const { data = {} } = req.body;
  if (data.price > 0) {
    return next();
  }
  next({ status: 400, message: "Must have a price greater than 0" });
}

function idMatchesRoute(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  // If id exists and does not match dishId, return 400
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id ${id} does not match route id ${dishId}`,
    });
  }

  next();
}

function isPriceNumber(req, res, next) {
  const { data = {} } = req.body;
  if (typeof data.price === 'number') {
    return next();
  }
  next({ status: 400, message: "price must be of type number" });
}

function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url} = {} } = req.body;

  // Update the paste
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

// TODO: Implement the /dishes handlers needed to make the tests pass
module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        bodyDataHas("price"),
        isLessThanZero,
        create
    ],
    read: [
        dishExists,
        read
    ],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        bodyDataHas("price"),
        isLessThanZero,
        isPriceNumber,
        idMatchesRoute,
        update
    ]
}
