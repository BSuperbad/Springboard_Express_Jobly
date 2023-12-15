const { BadRequestError } = require("../expressError");

/** Generate SQL query components for a partial update based on the provided data and mapping.
 * dataToUpdate is the data that will be updated, keys are column names and values are new values
 * jsToSql takes JavaScript column names and maps them to the SQL counterparts
 * 
 * const { setCols, values } = sqlForPartialUpdate({ firstName: 'Aliya', age: 32 }, { firstName: 'first_name' });
 * Returns: { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }
 */
 
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);

  // Throw an error if no data is provided for the update
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
