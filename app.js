const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertCovid19IndiaStatesDB = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  getStatesQuery = `select * from state order by state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachItem) => convertCovid19IndiaStatesDB(eachItem))
  );
});
//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertCovid19IndiaStatesDB(state));
});
//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths) values ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

const convertCovid19IndiaDistrictsDB = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
//API 4
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertCovid19IndiaDistrictsDB(district));
});
//API 5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id = ${districtId};`;
  const deleteDistrict = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;

  const updatedDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const stats = await db.get(getStatsQuery);
  response.send(stats);
});
//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `select state_id from district where district_id = ${districtId};`;
  const gottenStateId = await db.get(getStateIdQuery);
  const getStateNameQuery = `select state_name as stateName from state where state_id = ${gottenStateId.state_id};`;
  const gottenStateName = await db.get(getStateNameQuery);
  response.send(gottenStateName);
});
module.exports = app;
