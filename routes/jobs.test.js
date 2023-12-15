"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 100000, 
    equity: 0, 
    companyHandle: 'c1'
  };

  test("ok for Admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: 
        {
        id: expect.any(Number),
        title: "newJob",
        salary: 100000,
        equity: "0",
        companyHandle: 'c1'
         }
        });
  });

  test("not ok for non-Admins", async function (){
    const resp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    })
  })

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newJob,
          salary: -10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            { 
                id: expect.any(Number),
                title: 'Job1',
                salary: 100000, 
                equity: "0.01",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number), 
                title: 'Job2', 
                salary: 80000, 
                equity: "0.02",
                companyHandle: 'c3'
            },
            {
                id: expect.any(Number), 
                title: 'Job3', 
                salary: 120000, 
                equity: "0",
                companyHandle: 'c3'
            }
          ],
          
    });
  });

  test("ok with query parameters", async function () {
    const resp = await request(app).get("/jobs?title=J&minSalary=90000&hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
          [
            { 
              id: expect.any(Number),
              title: 'Job1',
              salary: 100000, 
              equity: "0.01",
              companyHandle: 'c1'
          }
          ],
    });
  
  });
  

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

// test("bad request with invalid minEmployees and maxEmployees", async function () {
//   const resp = await request(app).get("/companies?minEmployees=4&maxEmployees=3");
//   expect(resp.statusCode).toEqual(400);
// });

});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: 'Job1',
        salary: 100000, 
        equity: "0.01",
        companyHandle: 'c1'
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/00000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for Admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "Job1-updated",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: 'Job1-updated',
        salary: 100000, 
        equity: "0.01",
        companyHandle: 'c1'
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "Job1-updated",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-Admins", async function (){
    const resp = await request(app)
    .patch(`/jobs/1`)
    .send({
        title: "Job1-updated"
    })
    .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    })
  })

  test("not found or no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0000000`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          id:2,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          equity: 4,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for Admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-Admins", async function (){
    const resp = await request(app)
    .delete(`/jobs/1`)
    expect(resp.statusCode).toEqual(401);
  })

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/00000`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
