require("dotenv").config();
const Sequelize = require("sequelize");

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

const Region = sequelize.define(
  "Region",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
    subs: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);
//my favorite country is Armenia
const Country = sequelize.define(
  "Country",
  {
    a2code: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: Sequelize.STRING,
    official: Sequelize.STRING,
    nativeName: Sequelize.STRING,
    permanentUNSC: Sequelize.BOOLEAN,
    wikipediaURL: Sequelize.STRING,
    capital: Sequelize.STRING,
    regionId: Sequelize.INTEGER,
    languages: Sequelize.STRING,
    population: Sequelize.INTEGER,
    flag: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

Country.belongsTo(Region, { foreignKey: "regionId" });

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

function initialize() {
  return new Promise((res, rej) => {
    sequelize
      .sync()
      .then((result) => {
        res(result);
      })
      .catch((error) => {
        rej(error);
      });
  });
}

function getAllCountries() {
  return new Promise((res, rej) => {
    Country.findAll({ include: [Region] })
      .then((result) => {
        if (result.length > 0) {
          res(JSON.stringify(result));
        } else {
          throw new Error();
        }
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function getCountryByCode(countryCode) {
  return new Promise((res, rej) => {
    Country.findAll({ include: [Region], where: { a2code: countryCode } })
      .then((result) => {
        if (result.length > 0) {
          res(JSON.stringify(result[0]));
        } else {
          throw new Error();
        }
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function getCountriesByRegion(region) {
  return new Promise((res, rej) => {
    Country.findAll({
      include: [Region],
      where: {
        "$Region.name$": {
          [Sequelize.Op.iLike]: `%${region}%`,
        },
      },
    })
      .then((result) => {
        if (result.length > 0) {
          res(JSON.stringify(result));
        } else {
          throw new Error();
        }
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function addCountry(countryData) {
  return new Promise((res, rej) => {
    Country.create({
      a2code: countryData.a2code,
      name: countryData.name,
      official: countryData.official,
      nativeName: countryData.nativeName,
      permanentUNSC: countryData.permanentUNSC,
      wikipediaURL: countryData.wikipediaURL,
      capital: countryData.capital,
      regionId: countryData.regionId,
      languages: countryData.languages,
      population: countryData.population,
      flag: countryData.flag,
    })
      .then((result) => {
        res(JSON.stringify(result));
      })
      .catch((err) => {
        rej(err[0]);
      });
  });
}
function getAllRegions() {
  return new Promise(async (res, rej) => {
    Region.findAll()
      .then((result) => {
        if (result.length > 0) {
          res(JSON.stringify(result));
        } else {
          throw new Error();
        }
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function editCountry(countryCode, countryData) {
  return new Promise((res, rej) => {
    Country.update(
      {
        name: countryData.name,
        official: countryData.official,
        nativeName: countryData.nativeName,
        permanentUNSC: countryData.permanentUNSC,
        wikipediaURL: countryData.wikipediaURL,
        capital: countryData.capital,
        regionId: countryData.regionId,
        languages: countryData.languages,
        population: countryData.population,
        flag: countryData.flag,
      },
      {
        where: { a2code: countryCode },
      }
    )
      .then(() => {
        res();
      })
      .catch((err) => {
        rej(err[0]);
      });
  });
}

function deleteCountry(countryCode) {
  return new Promise((res, rej) => {
    Country.destroy({
      where: { a2code: countryCode },
    })
      .then(() => {
        res();
      })
      .catch((err) => {
        rej(err[0]);
      });
  });
}

module.exports = {
  initialize,
  getAllCountries,
  getCountryByCode,
  getCountriesByRegion,
  addCountry,
  getAllRegions,
  editCountry,
  deleteCountry,
};
