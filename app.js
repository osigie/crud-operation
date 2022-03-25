const fs = require("fs");
const http = require("http");

// To check if the file exist from the beginning , else create a newfile

let isExit = fs.existsSync("./product.json");

if (!isExit) {
  fs.writeFileSync("./product.json", JSON.stringify([]), "utf8", (err) => {
    if (err) {
      console.log(err);
    }
  });
}

/*
implement your server code here
*/
const { v4: uuidv4 } = require("uuid");
let products = require("./product.json");

const server = http.createServer((req, res) => {
  if (req.url === "/api/products" && req.method === "GET") {
    getProducts(req, res);
  } else if (req.url?.match(/\/api\/products\/\w+/) && req.method === "GET") {
    const id = req.url.split("/")[3];
    getProduct(req, res, id);
  } else if (req.url === "/api/products" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    createProduct(req, res);
  } else if (req.url?.match(/\/api\/products\/\w+/) && req.method === "PUT") {
    const id = req.url.split("/")[3];
    updateProduct(req, res, id);
  } else if (
    req.url?.match(/\/api\/products\/\w+/) &&
    req.method === "DELETE"
  ) {
    const id = req.url.split("/")[3];
    deleteProduct(req, res, id);
  } else {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

const PORT = process.env.PORT || 6000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// @desc    Gets All Products
// @route   GET /api/products
async function getProducts(req, res) {
  try {
    const productEl = await findAll();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(productEl));
  } catch (error) {
    console.log(error);
  }
}

// @desc    Gets Single Product
// @route   GET /api/product/:id
async function getProduct(req, res, id) {
  try {
    const product = await findById(id);

    if (!product) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Product Not Found" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(product));
    }
  } catch (error) {
    console.log(error);
  }
}

//function to get all data from the database
function findAll() {
  return new Promise((resolve, reject) => {
    resolve(products);
  });
}

//function to get data by id from the database
function findById(id) {
  return new Promise((resolve, reject) => {
    const product = products.find((p) => p.id === id);
    resolve(product);
  });
}

//function to write data to the database
function writeData() {
  fs.writeFileSync(
    "./product.json",
    JSON.stringify(products, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
}

// function to create data and adding the ids
function create(product) {
  return new Promise((resolve, reject) => {
    const newProduct = { id: uuidv4(), ...product };
    products.push(newProduct);
    writeData();
    resolve(newProduct);
  });
}

// function to get post data
function getPostData(req) {
  return new Promise((resolve, reject) => {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        resolve(body);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// @desc    Create a Product
// @route   POST /api/products
async function createProduct(req, res) {
  try {
    const body = await getPostData(req);
    const bodyObj = JSON.parse(body);
    const newProduct = await create(bodyObj);

    res.writeHead(201, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(newProduct));
  } catch (error) {
    console.log(error);
  }
}

// @desc    Update a Product
// @route   PUT /api/products/:id
async function updateProduct(req, res, id) {
  try {
    const company = await findById(id);

    if (!company) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Product Not Found" }));
    } else {
      const body = await getPostData(req);

      const bodyObj = JSON.parse(body);
      const updProduct = await update(id, bodyObj);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(updProduct));
    }
  } catch (error) {
    console.log(error);
  }
}

//function to update the database
function update(id, product) {
  return new Promise((resolve, reject) => {
    const index = products.findIndex((p) => p.id === id);
    products[index] = { id, ...product };
    writeData();
    resolve(products[index]);
  });
}

//function to remove data from database
function remove(id) {
  return new Promise((resolve, reject) => {
    products = products.filter((p) => p.id !== id);
    writeData();
    resolve("");
  });
}

// @desc    Delete Product
// @route   DELETE /api/product/:id
async function deleteProduct(req, res, id) {
  let product;
  try {
    product = await findById(id);
  } catch (error) {
    console.log(error);
  }

  if (!product) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Product Not Found" }));
    return;
  }

  await remove(id);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: `Product ${id} removed` }));
}
