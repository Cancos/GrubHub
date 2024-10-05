const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function validateDishes(req, res, next) {
  const { data = {} } = req.body;
  const { dishes } = data;

  // Check if dishes is an array
  if (!Array.isArray(dishes)) {
    return next({ status: 400, message: "dishes must be of type array" });
  }

  // Check if dishes array is empty
  if (dishes.length === 0) {
    return next({ status: 400, message: "dishes must not be empty" });
  }

  // Check each dish in the dishes array
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];

    // Check if dish is missing quantity
    if (!dish.quantity) {
      return next({ status: 400, message: `dish ${i} must have a quantity that is an integer greater than 0` });
    }

    // Check if quantity is greater than 0
    if (dish.quantity <= 0) {
      return next({ status: 400, message: `dish ${i} must have a quantity that is an integer greater than 0` });
    }

    // Check if quantity is an integer
    if (!Number.isInteger(dish.quantity)) {
      return next({ status: 400, message: `dish ${i} must have a quantity that is an integer greater than 0` });
    }
  }

  // If all validations pass
  next();
}

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `order id not found: ${orderId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Update the paste
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function idMatchesRoute(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  // If id exists and does not match orderId, return 400
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id ${id} does not match route id ${orderId}`,
    });
  }

  next();
}

function isStatusValid(req, res, next) {
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
    const { data = {} } = req.body;
    if (data.status && validStatuses.includes(data.status)) {
        next();
    }

    return next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
}

function isStatusDelivered(req, res, next) {
    const { data = {} } = req.body;
    if (data.status && data.status === "delivered") {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`,
        });
    }

    next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

function isStatusPending(req, res, next) {
    const order = res.locals.order;
    if (order.status && order.status !== "pending") {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`,
        });
    }

    next();
}


module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDishes,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        validateDishes,
        idMatchesRoute,
        isStatusValid,
        isStatusDelivered,
        update
    ],
    delete: [
        orderExists,
        isStatusPending,
        destroy
    ]
}