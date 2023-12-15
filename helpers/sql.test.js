const { BadRequestError } = require('../expressError');
const {sqlForPartialUpdate} = require('./sql');

describe("sqlForPartialUpdate", ()=>{
    it("throws an error when no data is provided", ()=>{
        expect(()=> sqlForPartialUpdate({})).toThrowError(BadRequestError)
        
    });
    it("maps JavaScript column names to SQL column names", ()=> {
        const data = { firstName: 'Aliya', age: 32 };
        const jsToSql = {firstName: "first_name"};
        const result = sqlForPartialUpdate(data, jsToSql);
        expect(result.setCols).toEqual(`"first_name"=$1, "age"=$2`);
        expect(result.values).toEqual(["Aliya", 32]);
    })
})