const dbconn = require("../config/db");

const db = require("../config/db"); // adjust to your DB

const view = (req, res) => {
  let search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;

  // let query = "SELECT * FROM students";
  let value = [];
  const LIMIT = 10;
  const offset = (page - 1) * LIMIT;
  const pagiquery = "SELECT COUNT(*) AS total FROM students";

  if (search) {
    let column = "";
    let keyword = "";

    // detect prefix
    if (search.startsWith("$")) {
      column = "fname";
      keyword = search.slice(1);
    } else if (search.startsWith("%")) {
      column = "lname";
      keyword = search.slice(1);
    } else if (search.startsWith("#")) {
      column = "city";
      keyword = search.slice(1);
    } else if (search.startsWith("@")) {
      column = "email";
      keyword = search.slice(1);
    } else if (search.startsWith("!")) {
      column = "phone";
      keyword = search.slice(1);
    } else {
      // default: search all fields
      query += ` WHERE fname LIKE ? OR lname LIKE ? OR city LIKE ? OR email LIKE ? OR phone LIKE ?`;
      value = Array(5).fill(`%${search}%`);
    }

    if (column) {
      query += ` WHERE ${column} LIKE ?`;
      value = [`%${keyword}%`];
    }
  }

  // db.query(query, value, (err, result) => {
  //     if (err) throw err;
  //     res.render("index", { result });
  // });

  db.query(pagiquery, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error counting records");
    }

    const totalRecords = result[0].total;
    console.log(totalRecords);

    const totalPages = Math.ceil(totalRecords / LIMIT);
    console.log(totalPages);
    db.query("SELECT * FROM students LIMIT ? OFFSET ?", [LIMIT,offset],(err, students) => {
      if (err) {
        console.log(err);
        return res.send("Error fetching students");

      }else{
        console.log(students)
      }

      if (students.length === 0) {
        return res.send("Searched data is not in database");

       
      }
       res.render("index",{result:students,currentPage:page,totalPages:totalPages})
    });
  });
};

module.exports = {
  view,
};
