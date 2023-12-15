"use strict";

const { min } = require("lodash");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING 
           id,
           title, 
           salary, 
           equity, 
           company_handle AS "companyHandle"`,
        [
            title, 
            salary, 
            equity, 
            companyHandle
        ],
    );
    const job = result.rows[0];
    

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT 
          id,
          title, 
          salary, 
          equity, 
          company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Find all jobs from a certain company.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAllByCompany(company_handle) {
    const jobsRes = await db.query(
          `SELECT 
          id,
          title, 
          salary, 
          equity, 
          company_handle AS "companyHandle"
           FROM jobs
           WHERE company_handle = $1
           ORDER BY title`, 
           [company_handle]);
    if (!jobsRes) {
      return null
    }
    return jobsRes.rows;
  }


  /** Find jobs based on criteria passed in a query string.
   * 
   * Returns [{ title, salary, equity, companyHandle }] that match the entered query of (title, minSalary, hasEquity, or all)
   */

  static async findByCriteria({ title, minSalary, hasEquity }) {
  
    let query = `
    SELECT 
    id,
    title, 
    salary, 
    equity, 
    company_handle AS "companyHandle"
     FROM jobs`;
  
    const values = [];
  
    // if ?title= in the URL, where the value is in any title, push the job to the values array
    if (title) {
      query += `
        WHERE title ILIKE $1`;
      values.push(`%${title}%`);
    }
  
    // if title has a value and minSalary have a value, or title does not have a value, look for where salary is greater than or equal to the value that is entered
    if (minSalary) {
      query += `
        ${title ? 'AND' : 'WHERE'} salary >= $${values.length + 1}`;
      values.push(minSalary);
    }
  
    // if title has a value, minSalary, and hasEquity have a value, or title/ minSalary do not have a value, look for where hasEquity is true (greater than 0)
    if (hasEquity === "true" || hasEquity === true) {
      query += `
        ${title || minSalary ? 'AND' : 'WHERE'} equity > 0`;
    }
    // if hasEquity is false, yield only jobs with "0" equity
    else if (hasEquity === 'false' || hasEquity === false) {
      query += `
        ${title || minSalary ? 'AND' : 'WHERE'} equity = 0`;
    }
  
    query += `
      ORDER BY title`;
  
    const jobsRes = await db.query(query, values);
  
    return jobsRes.rows;
  }
  



  /** Given a job title, return data about job.
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT 
          id,
          title, 
          salary, 
          equity, 
          company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
           [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with an id of ${id}`);
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                      title, 
                      salary, 
                      equity, 
                      company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const deletedId = result.rows[0];

    if (!deletedId) throw new NotFoundError(`No job found`);
    return deletedId;
  }
}

module.exports = Job;
