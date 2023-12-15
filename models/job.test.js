"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Kinda Job",
    salary: 100000,
    equity: 0.1,
    companyHandle: 'c1'
  };

  test("works", async function () {
    try {
      let job = await Job.create(newJob);
  
      expect(job.id).toBeDefined();
      expect(job).toEqual({
        id: expect.any(Number),
        title: "New Kinda Job",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1"
      });
  
      const result = await db.query(
        `SELECT id, title, salary, equity, company_handle
         FROM jobs
         WHERE id = $1`, [job.id]);
  
      expect(result.rows).toEqual([
        {
          id: job.id,
          title: "New Kinda Job",
          salary: 100000,
          equity: "0.1",
          company_handle: "c1"
        }
      ]);
    } catch (error) {
      throw error;
    }
  });
  
});

// /************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
        {
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01", 
        companyHandle: 'c1'
      },
      {
        id: 2, 
        title: 'Job2', 
        salary: 80000, 
        equity: "0.02", 
        companyHandle: 'c3'
      },
      {
        id: 3, 
        title: 'Job3', 
        salary: 120000, 
        equity: "0", 
        companyHandle: 'c3'
      }
    ]);
  });
});

// /************************************** findAllByCompany */

describe("findAllByCompany", function () {
  test("works", async function () {
    let jobs = await Job.findAllByCompany('c1');
    expect(jobs).toEqual([
        {
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01", 
        companyHandle: 'c1'
      }
    ]);
  });
});

/************************************** findByCriteria */

describe("findByCriteria", function () {
  test("works: title filter", async function () {
    const jobs = await Job.findByCriteria({ title: "Job" });
    expect(jobs).toEqual([
      {
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01",
        companyHandle: 'c1'
      },
      {
        id: 2, 
        title: 'Job2', 
        salary: 80000, 
        equity: "0.02",
        companyHandle: 'c3'
      },
      {
        id: 3,
        title: 'Job3',
        salary: 120000,
        equity: "0",
        companyHandle: 'c3'
      }
    ]);
  });

  test("works: minSalary filter", async function () {
    const jobs = await Job.findByCriteria({ minSalary: 110000 });
    expect(jobs).toEqual([
      {
        id: 3,
        title: 'Job3',
        salary: 120000,
        equity: "0",
        companyHandle: 'c3'
      }
    ]);
  });

  test("works: hasEquity as true filter", async function () {
    const jobs = await Job.findByCriteria({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01",
        companyHandle: 'c1'
      },
      {
        id: 2, 
        title: 'Job2', 
        salary: 80000, 
        equity: "0.02",
        companyHandle: 'c3'
      },
    ]);
  });
  test("works: hasEquity as false filter", async function () {
    const jobs = await Job.findByCriteria({ hasEquity: false });
    expect(jobs).toEqual([
      {
        id: 3,
        title: 'Job3',
        salary: 120000,
        equity: "0",
        companyHandle: 'c3'
      }
    ]);
  });

  test("works: title, minSalary, hasEquity filters", async function () {
    const jobs = await Job.findByCriteria({
      title: "J",
      minSalary: 90000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01",
        companyHandle: 'c1'
      },
    ]);
  });
});


// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: 1, 
        title: 'Job1', 
        salary: 100000, 
        equity: "0.01", 
        companyHandle: 'c1'
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(99999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
    const updateData = {
        salary: 120000,
        equity: "0.2",
        companyHandle: "c1",
    };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
        title: "Job1",
        id: 1,
        ...updateData
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
        id: 1, 
        title: 'Job1', 
        salary: 120000,
        equity: "0.2",
        company_handle: "c1",
    }]);
});


  test("works: null fields", async function () {
    const updateDataSetNulls = {
        salary: 90000
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
        id: 1,
      title: "Job1",
      equity: "0.01",
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
        `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE id = 1`);
    expect(result.rows).toEqual([{
        id: 1, 
        title: 'Job1', 
        salary: 90000,
        equity: "0.01",
        company_handle: "c1",
    }]);
})


  test("not found if no such job", async function () {
    try {
      await Job.update(9999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });



  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
})

})


// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT title FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(9999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

