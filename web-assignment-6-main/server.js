/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *   Name: Navya Student ID: 145966222  Date: 04/12/2024
 *
 *  Published URL:https://rich-colt-parka.cyclic.app
 *
 ********************************************************************************/

const express = require("express");
const app = express();
const unCountryData = require("./modules/unCountries");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

app.set("view engine", "ejs");
var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // Body Parsing Middleware for HTML form
app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login", {
    errorMessage: "",
  });
});
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      res.redirect("/un/countries");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
  });
});

app.post("/register", (req, res) => {
  console.log(typeof req.body);
  console.log("Object: ", req.body);
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      console.log("Error: ", err);
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/un/countries", async (req, res, next) => {
  try {
    let countries;
    const region = req.query.region;

    if (region) {
      countries = await unCountryData.getCountriesByRegion(region);
      res.render("countries", { countries });
    } else {
      countries = await unCountryData.getAllCountries();

      res.render("countries", { countries });
    }
  } catch (err) {
    next(err);
  }
});

app.get("/un/countries/:countryCode", async (req, res, next) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();
    let country = JSON.parse(await unCountryData.getCountryByCode(countryCode));

    res.render("country", { country: country });
  } catch {
    next();
  }
});

app.get("/un/addCountry", ensureLogin, async (req, res, next) => {
  try {
    let regions = JSON.parse(await unCountryData.getAllRegions());
    res.render("addCountry", { regions: regions });
  } catch {
    next();
  }
});

app.post("/un/addCountry", ensureLogin, async (req, res, next) => {
  try {
    req.body.permanentUNSC = req.body.permanentUNSC ? true : false;
    req.body.regionId = parseInt(req.body.regionId);
    req.body.population = parseInt(req.body.population);

    await unCountryData.addCountry(req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/un/editCountry/:code", ensureLogin, async (req, res, next) => {
  try {
    const countryCode = req.params.code;

    const countryData = JSON.parse(
      await unCountryData.getCountryByCode(countryCode)
    );

    const regionsData = JSON.parse(await unCountryData.getAllRegions());

    res.render("editCountry", { regions: regionsData, country: countryData });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.post("/un/editCountry", ensureLogin, async (req, res, next) => {
  try {
    await unCountryData.editCountry(req.body.a2code, req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/un/deleteCountry/:code", ensureLogin, async (req, res, next) => {
  try {
    const countryCode = req.params.code;
    await unCountryData.deleteCountry(countryCode);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});

unCountryData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log(`server listening on: ${HTTP_PORT}`)
    );
  })
  .catch((err) => {
    console.log("Error: ", err);
  });
