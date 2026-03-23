const express = require("express");
const dbconn = require("./config/db");
const { body, param, query, validationResult } = require("express-validator");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()); // debug ke liye
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  next();
};

// ================= BASIC =================
app.get("/", (req, res) => {
  res.render("basic_form");
});

app.post(
  "/",
  [
    body("fname")
      .notEmpty().withMessage("First name is required")
      .isLength({ min: 2 }).withMessage("First name must be at least 2 chars"),

    body("lname")
      .notEmpty().withMessage("Last name is required"),

    body("Email")
      .isEmail().withMessage("Invalid email"),

    body("phonenumber")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone must be 10 digits")
      .isNumeric().withMessage("Phone must be number"),

    body("zipcode")
      .isNumeric().withMessage("Zipcode must be number"),

    body("gender")
      .notEmpty().withMessage("Gender is required"),

    body("db")
      .notEmpty().withMessage("Date of birth required"),
  ],
  validate,
  (req, res) => {
    const {
      fname,
      lname,
      Designation,
      Address1,
      Address2,
      Email,
      city,
      state,
      gender,
      zipcode,
      relationshipstatus,
      phonenumber,
      db,
    } = req.body;

    const sql = `INSERT INTO basic_table
    (first_name,last_name,designation,address1,address2,email,city,state1,gender,zipcode,rs,phoneno,dob)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    dbconn.query(
      sql,
      [
        fname,
        lname,
        Designation,
        Address1,
        Address2,
        Email,
        city,
        state,
        gender,
        zipcode,
        relationshipstatus,
        phonenumber,
        db,
      ],
      (err, result) => {
        if (err) return res.send("DB Error");

        res.redirect(`/education?student_id=${result.insertId}`);
      }
    );
  }
);
// ================= EDUCATION =================
app.get("/education", (req, res) => {
  res.render("education_form", { studentId: req.query.student_id });
});

app.post(
  "/education",
  [
    body("student_id")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    // 10th
    body("nameofboard").notEmpty().withMessage("Board name required"),
    body("passingyear").isNumeric().withMessage("Passing year must be number"),
    body("percentage1").isFloat({ min: 0, max: 100 }).withMessage("Invalid %"),

    // 12th
    body("nameofboard1").notEmpty().withMessage("Board name required"),
    body("passingyear1").isNumeric(),
    body("percentage2").isFloat({ min: 0, max: 100 }),

    // Graduation
    body("coursename1").notEmpty(),
    body("University1").notEmpty(),
    body("passingyear2").isNumeric(),
    body("percentage3").isFloat({ min: 0, max: 100 }),

    // Post Graduation (optional 🔥)
    body("coursename2").optional({ checkFalsy: true }),
    body("University2").optional({ checkFalsy: true }),
    body("passingyear3").optional({ checkFalsy: true }).isNumeric(),
    body("percentage4").optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
  ],
  validate,
  (req, res) => {
    const {
      student_id,
      nameofboard,
      passingyear,
      percentage1,
      nameofboard1,
      passingyear1,
      percentage2,
      coursename1,
      University1,
      passingyear2,
      percentage3,
      coursename2,
      University2,
      passingyear3,
      percentage4,
    } = req.body;

    const sql = `INSERT INTO education_details 
    (student_id, education_type_id, course_name, board_or_university, passing_year, percentage) 
    VALUES ?`;

    const values = [
      [student_id, 1, null, nameofboard, passingyear, percentage1],
      [student_id, 2, null, nameofboard1, passingyear1, percentage2],
      [student_id, 3, coursename1, University1, passingyear2, percentage3],
      [student_id, 4, coursename2 || null, University2 || null, passingyear3 || null, percentage4 || null],
    ];

    dbconn.query(sql, [values], (err) => {
      if (err) return res.send("DB Error");

      res.redirect(`/workexp?student_id=${student_id}`);
    });
  }
);
// ================= WORK =================
app.get("/workexp", (req, res) => {
  res.render("workexp_form", { studentId: req.query.student_id });
});

app.post(
  "/workexp",
  [
    body("studentId")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    // Company 1 (optional but if filled → validate)
    body("company1").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("designation1").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("from1").optional({ checkFalsy: true }).isDate().withMessage("Invalid date"),
    body("to1").optional({ checkFalsy: true }).isDate().withMessage("Invalid date"),

    // Company 2
    body("company2").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("designation2").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("from2").optional({ checkFalsy: true }).isDate(),
    body("to2").optional({ checkFalsy: true }).isDate(),

    // Company 3
    body("company3").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("designation3").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("from3").optional({ checkFalsy: true }).isDate(),
    body("to3").optional({ checkFalsy: true }).isDate(),
  ],
  validate,
  (req, res) => {
    const {
      studentId,
      company1,
      designation1,
      from1,
      to1,
      company2,
      designation2,
      from2,
      to2,
      company3,
      designation3,
      from3,
      to3,
    } = req.body;

    const sql = `INSERT INTO work_experience 
    (basic_id, company_name, designation, from_date, to_date) VALUES ?`;

    const values = [
      [studentId, company1, designation1, from1, to1],
      [studentId, company2, designation2, from2, to2],
      [studentId, company3, designation3, from3, to3],
    ].filter((v) => v[1] && v[2]); // only valid rows

    // ✅ IMPORTANT: empty insert avoid
    if (!values.length) {
      return res.redirect(`/languageknown?student_id=${studentId}`);
    }

    dbconn.query(sql, [values], (err) => {
      if (err) return res.send("DB Error");

      res.redirect(`/languageknown?student_id=${studentId}`);
    });
  }
);

// ================= LANGUAGE =================
app.get("/languageknown", (req, res) => {
  res.render("languageKnown", { studentId: req.query.student_id });
});

app.post(
  "/languageknown",
  [
    body("studentId")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    // Optional checkboxes (if present must be valid)
    body("english").optional(),
    body("hindi").optional(),
    body("gujarati").optional(),
  ],
  validate,
  (req, res) => {
    const {
      studentId,
      english,
      englishRead,
      englishWrite,
      englishSpeak,
      hindi,
      hindiRead,
      hindiWrite,
      hindiSpeak,
      gujarati,
      gujaratiRead,
      gujaratiWrite,
      gujaratiSpeak,
    } = req.body;

    const sql = `
      INSERT INTO student_languages
      (basic_id, lang_id, can_read, can_write, can_speak)
      VALUES ?
    `;

    let values = [];

    // English → lang_id = 1
    if (english) {
      values.push([
        studentId,
        1,
        englishRead ? 1 : 0,
        englishWrite ? 1 : 0,
        englishSpeak ? 1 : 0,
      ]);
    }

    // Hindi → lang_id = 2
    if (hindi) {
      values.push([
        studentId,
        2,
        hindiRead ? 1 : 0,
        hindiWrite ? 1 : 0,
        hindiSpeak ? 1 : 0,
      ]);
    }

    // Gujarati → lang_id = 3
    if (gujarati) {
      values.push([
        studentId,
        3,
        gujaratiRead ? 1 : 0,
        gujaratiWrite ? 1 : 0,
        gujaratiSpeak ? 1 : 0,
      ]);
    }

    // ✅ If nothing selected → skip DB
    if (values.length === 0) {
      return res.redirect(`/technologyknown?student_id=${studentId}`);
    }

    dbconn.query(sql, [values], (err) => {
      if (err) {
        console.log(err);
        return res.send("DB Error");
      }

      console.log("Language inserted");

      res.redirect(`/technologyknown?student_id=${studentId}`);
    });
  }
);

// ================= TECHNOLOGY =================
app.get("/technologyknown", (req, res) => {
  sql = `SELECT * FROM technologies`;
  dbconn.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("success tech getting from db");
    }
    res.render("technologyKnown", {
      techs: result,
      studentId: req.query.student_id,
    });
  });
  // res.render("technologyKnown", { studentId: req.query.student_id },{techs});
});

app.post(
  "/technologyknown",
  [
    body("studentId")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    // tech must be array (important 🚨)
    body("tech")
      .custom((value) => {
        if (!value) return true; // allow empty (optional)
        if (!Array.isArray(value)) {
          throw new Error("Tech must be an array");
        }
        return true;
      }),

    // levels optional but if present must be valid
    body("level_1").optional({ checkFalsy: true }).isIn(["Beginner", "Intermediate", "Expert"]),
    body("level_2").optional({ checkFalsy: true }).isIn(["Beginner", "Intermediate", "Expert"]),
    body("level_3").optional({ checkFalsy: true }).isIn(["Beginner", "Intermediate", "Expert"]),
    body("level_4").optional({ checkFalsy: true }).isIn(["Beginner", "Intermediate", "Expert"]),
  ],
  validate,
  (req, res) => {
    const { studentId, tech, level_1, level_2, level_3, level_4 } = req.body;

    const sql = `INSERT INTO student_technologies (basic_id, tech_id, level) VALUES ?`;

    // ✅ SAFE: if tech not array → treat as empty
    const techArray = Array.isArray(tech) ? tech : [];

    let rawValues = [
      [techArray[0], level_1],
      [techArray[1], level_2],
      [techArray[2], level_3],
      [techArray[3], level_4],
    ];

    // ✅ Filter valid entries
    let values = rawValues
      .filter(([t, l]) => t && l)
      .map(([t, l]) => [studentId, t, l]);

    // ✅ Prevent empty insert
    if (values.length === 0) {
      return res.redirect(`/referances?student_id=${studentId}`);
    }

    dbconn.query(sql, [values], (err) => {
      if (err) {
        console.log(err);
        return res.send("DB Error");
      }

      console.log("success");

      res.redirect(`/referances?student_id=${studentId}`);
    });
  }
);

// ================= REFERENCES =================
app.get("/referances", (req, res) => {
  const studentId = req.query.student_id;

  res.render("referances", { studentId });
});

app.post(
  "/referances",
  [
    body("studentId")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    // Reference 1 (optional but if filled → validate)
    body("name1").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("contact1")
      .optional({ checkFalsy: true })
      .isLength({ min: 10, max: 10 }).withMessage("Contact must be 10 digits")
      .isNumeric().withMessage("Contact must be number"),
    body("relation1").optional({ checkFalsy: true }),

    // Reference 2
    body("name2").optional({ checkFalsy: true }).isLength({ min: 2 }),
    body("contact2")
      .optional({ checkFalsy: true })
      .isLength({ min: 10, max: 10 })
      .isNumeric(),
    body("relation2").optional({ checkFalsy: true }),
  ],
  validate,
  (req, res) => {
    const {
      studentId,
      name1,
      contact1,
      relation1,
      name2,
      contact2,
      relation2,
    } = req.body;

    const sql = `INSERT INTO reference_contacts 
    (basic_id,name,contact_number,relation) values ?`;

    // ✅ Only insert valid references
    const values = [
      [studentId, name1, contact1, relation1],
      [studentId, name2, contact2, relation2],
    ].filter((v) => v[1] && v[2]); // name + contact required

    // ✅ Prevent empty insert
    if (!values.length) {
      return res.redirect(`/preferances?student_id=${studentId}`);
    }

    dbconn.query(sql, [values], (err) => {
      if (err) return res.send("DB Error");

      res.redirect(`/preferances?student_id=${studentId}`);
    });
  }
);

app.get("/preferances", (req, res) => {
  res.render("preferances", { studentId: req.query.student_id });
});

app.post(
  "/preferances",
  [
    body("studentId")
      .notEmpty().withMessage("Student ID required")
      .isNumeric().withMessage("Invalid student ID"),

    body("preferred_location")
      .notEmpty().withMessage("Location required")
      .isLength({ min: 2 }).withMessage("Invalid location"),

    body("notice_period")
      .notEmpty().withMessage("Notice period required")
      .isIn(["Immediate", "15 Days", "1 Month", "2 Months", "3 Months"])
      .withMessage("Invalid notice period"),

    body("department")
      .notEmpty().withMessage("Department required"),

    body("expected_ctc")
      .notEmpty().withMessage("CTC required")
      .isNumeric().withMessage("CTC must be number")
      .isFloat({ min: 0 }).withMessage("Invalid CTC"),
  ],
  validate,
  (req, res) => {
    const {
      studentId,
      preferred_location,
      notice_period,
      department,
      expected_ctc,
    } = req.body;

    const sql = `INSERT INTO preferences 
    (basic_id, preferred_location, notice_period, department, expected_ctc) 
    VALUES (?, ?, ?, ?, ?)`;

    const values = [
      studentId,
      preferred_location,
      notice_period,
      department,
      expected_ctc,
    ];

    dbconn.query(sql, values, (err) => {
      if (err) {
        return res.send("Error in DB");
      }

      console.log("success");

      res.send(`
        <html><body style="font-family:Arial;text-align:center;padding:60px;">
          <h2 style="color:#27ae60;">&#10003; Application submitted successfully!</h2>
          <p style="margin:20px 0;">
            <a href="/" style="margin:0 10px;padding:10px 22px;background:#4a90e2;color:#fff;border-radius:5px;text-decoration:none;">+ New Application</a>
            <a href="/applicants" style="margin:0 10px;padding:10px 22px;background:#27ae60;color:#fff;border-radius:5px;text-decoration:none;">&#128100; View All Applicants</a>
          </p>
        </body></html>
      `);
    });
  }
);

// ================= VIEW ALL APPLICANTS (PAGINATED) =================
app.get("/applicants", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  dbconn.query(
    "SELECT COUNT(*) AS total FROM basic_table",
    (err, countResult) => {
      if (err) return res.send("DB Error");
      const totalCount = countResult[0].total;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));

      dbconn.query(
        "SELECT * FROM basic_table ORDER BY basic_id ASC LIMIT ? OFFSET ?",
        [limit, offset],
        (err2, applicants) => {
          if (err2) return res.send("DB Error");
          res.render("applicants", {
            applicants,
            page,
            totalPages,
            totalCount,
          });
        },
      );
    },
  );
});

// ================= EDIT APPLICANT – GET (load all data) =================
// app.get("/edit/:id", (req, res) => {
//   const id = req.params.id;

//   const q = (sql, params) =>
//     new Promise((resolve, reject) => {
//       dbconn.query(sql, params, (err, rows) =>
//         err ? reject(err) : resolve(rows),
//       );
//     });

//   Promise.all([
//     q("SELECT * FROM basic_table WHERE basic_id = ?", [id]),
//     q("SELECT * FROM education_details WHERE student_id = ?", [id]),
//     q("SELECT * FROM work_experience WHERE basic_id = ?", [id]),
//     q("SELECT * FROM student_languages WHERE basic_id = ?", [id]),
//     q(
//       `SELECT st.*, t.tech_name, st.level FROM student_technologies st
//        JOIN technologies t ON st.tech_id = t.tech_id
//        WHERE st.basic_id = ?`,
//       [id],
//     ),
//     q("SELECT * FROM reference_contacts WHERE basic_id = ?", [id]),
//     q("SELECT * FROM preferences WHERE basic_id = ?", [id]),
//   ])
//     .then(
//       ([
//         basicRows,
//         education,
//         workexp,
//         languages,
//         technologies,
//         references,
//         prefRows,
//       ]) => {
//         if (!basicRows.length) return res.send("Applicant not found");
//         res.render("edit_form", {
//           basic: basicRows[0],
//           education,
//           workexp,
//           languages,
//           technologies,
//           references,
//           preferences: prefRows[0] || {},
//         });
//       },
//     )
//     .catch((err) => {
//       console.log(err);
//       res.send("DB Error");
//     });
// });

// ================= EDIT APPLICANT – GET (load all data) =================
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;

  // 1. Get basic info first
  dbconn.query("SELECT * FROM basic_table WHERE basic_id = ?", [id], (err, basicRows) => {
    if (err) return res.send("DB Error");
    if (!basicRows.length) return res.send("Applicant not found");

    // 2. Get education details
    dbconn.query("SELECT * FROM education_details WHERE student_id = ?", [id], (err2, education) => {
      if (err2) return res.send("DB Error");

      // 3. Get work experience
      dbconn.query("SELECT * FROM work_experience WHERE basic_id = ?", [id], (err3, workexp) => {
        if (err3) return res.send("DB Error");

        // 4. Get languages
        dbconn.query("SELECT * FROM student_languages WHERE basic_id = ?", [id], (err4, languages) => {
          if (err4) return res.send("DB Error");

          // 5. Get technologies (with JOIN)
          dbconn.query(
            `SELECT st.*, t.tech_name, st.level FROM student_technologies st
             JOIN technologies t ON st.tech_id = t.tech_id
             WHERE st.basic_id = ?`,
            [id],
            (err5, technologies) => {
              if (err5) return res.send("DB Error");

              // 6. Get references
              dbconn.query("SELECT * FROM reference_contacts WHERE basic_id = ?", [id], (err6, references) => {
                if (err6) return res.send("DB Error");

                // 7. Get preferences (last one)
                dbconn.query("SELECT * FROM preferences WHERE basic_id = ?", [id], (err7, prefRows) => {
                  if (err7) return res.send("DB Error");

                  // All data loaded - render
                  res.render("edit_form", {
                    basic: basicRows[0],
                    education,
                    workexp,
                    languages,
                    technologies,
                    references,
                    preferences: prefRows[0] || {},
                  });
                });
              });
            }
          );
        });
      });
    });
  });
});

// ================= EDIT APPLICANT – POST (save changes) =================
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const {
    fname,
    lname,
    Designation,
    Address1,
    Address2,
    Email,
    city,
    state,
    gender,
    zipcode,
    relationshipstatus,
    phonenumber,
    db,
    nameofboard,
    passingyear,
    percentage1,
    nameofboard1,
    passingyear1,
    percentage2,
    coursename1,
    University1,
    passingyear2,
    percentage3,
    coursename2,
    University2,
    passingyear3,
    percentage4,
    company1,
    designation1,
    from1,
    to1,
    company2,
    designation2,
    from2,
    to2,
    company3,
    designation3,
    from3,
    to3,
    english,
    englishRead,
    englishWrite,
    englishSpeak,
    hindi,
    hindiRead,
    hindiWrite,
    hindiSpeak,
    gujarati,
    gujaratiRead,
    gujaratiWrite,
    gujaratiSpeak,
    php,
    php_level,
    laravel,
    laravel_level,
    mysql,
    mysql_level,
    oracle,
    oracle_level,
    javascript,
    javascript_level,
    react,
    react_level,
    nodejs,
    nodejs_level,
    name1,
    contact1,
    relation1,
    name2,
    contact2,
    relation2,
    preferred_location,
    notice_period,
    department,
    expected_ctc,
  } = req.body;

  const q = (sql, params) =>
    new Promise((resolve, reject) => {
      dbconn.query(sql, params, (err, result) =>
        err ? reject(err) : resolve(result),
      );
    });

  // 1. Update basic_table
  const updateBasic = q(
    `UPDATE basic_table SET first_name=?,last_name=?,designation=?,address1=?,address2=?,
     email=?,city=?,state1=?,gender=?,zipcode=?,rs=?,phoneno=?,dob=? WHERE basic_id=?`,
    [
      fname,
      lname,
      Designation,
      Address1,
      Address2,
      Email,
      city,
      state,
      gender,
      zipcode,
      relationshipstatus,
      phonenumber,
      db,
      id,
    ],
  );

  // 2. Update education_details (by student_id + type)
  const updateEdu = Promise.all([
    q(
      `UPDATE education_details SET board_or_university=?,passing_year=?,percentage=?,course_name=NULL
       WHERE student_id=? AND education_type_id=1`,
      [nameofboard, passingyear, percentage1, id],
    ),
    q(
      `UPDATE education_details SET board_or_university=?,passing_year=?,percentage=?,course_name=NULL
       WHERE student_id=? AND education_type_id=2`,
      [nameofboard1, passingyear1, percentage2, id],
    ),
    q(
      `UPDATE education_details SET course_name=?,board_or_university=?,passing_year=?,percentage=?
       WHERE student_id=? AND education_type_id=3`,
      [coursename1, University1, passingyear2, percentage3, id],
    ),
    q(
      `UPDATE education_details SET course_name=?,board_or_university=?,passing_year=?,percentage=?
       WHERE student_id=? AND education_type_id=4`,
      [coursename2, University2, passingyear3, percentage4, id],
    ),
  ]);

  // 3. Rebuild work_experience
  const newWork = [
    [id, company1, designation1, from1, to1],
    [id, company2, designation2, from2, to2],
    [id, company3, designation3, from3, to3],
  ].filter((v) => v[1] && v[2]);

  const updateWork = q("DELETE FROM work_experience WHERE basic_id=?", [
    id,
  ]).then(() =>
    newWork.length
      ? q(
        "INSERT INTO work_experience (basic_id,company_name,designation,from_date,to_date) VALUES ?",
        [newWork],
      )
      : Promise.resolve(),
  );

  // 4. Rebuild student_languages
  const langValues = [];
  if (english)
    langValues.push([
      id,
      1,
      englishRead ? 1 : 0,
      englishWrite ? 1 : 0,
      englishSpeak ? 1 : 0,
    ]);
  if (hindi)
    langValues.push([
      id,
      2,
      hindiRead ? 1 : 0,
      hindiWrite ? 1 : 0,
      hindiSpeak ? 1 : 0,
    ]);
  if (gujarati)
    langValues.push([
      id,
      3,
      gujaratiRead ? 1 : 0,
      gujaratiWrite ? 1 : 0,
      gujaratiSpeak ? 1 : 0,
    ]);

  const updateLang = q("DELETE FROM student_languages WHERE basic_id=?", [
    id,
  ]).then(() =>
    langValues.length
      ? q(
        "INSERT INTO student_languages (basic_id,lang_id,can_read,can_write,can_speak) VALUES ?",
        [langValues],
      )
      : Promise.resolve(),
  );

  // 5. Rebuild student_technologies
  const techMap = {
    php: { name: "PHP", level: php_level },
    laravel: { name: "Laravel", level: laravel_level },
    mysql: { name: "MySQL", level: mysql_level },
    oracle: { name: "Oracle", level: oracle_level },
    javascript: { name: "JavaScript", level: javascript_level },
    react: { name: "React", level: react_level },
    nodejs: { name: "Node.js", level: nodejs_level },
  };
  const selectedTechs = Object.entries(techMap)
    .filter(([key]) => req.body[key])
    .map(([, val]) => val);

  const updateTech = q("DELETE FROM student_technologies WHERE basic_id=?", [
    id,
  ]).then(() => {
    if (!selectedTechs.length) return;
    const insertOneTech = (index) => {
      if (index >= selectedTechs.length) return Promise.resolve();
      const { name, level } = selectedTechs[index];
      return q("SELECT tech_id FROM technologies WHERE tech_name=?", [name])
        .then((rows) => {
          if (rows.length)
            return q(
              "INSERT INTO student_technologies (basic_id,tech_id,level) VALUES (?,?,?)",
              [id, rows[0].tech_id, level || "Beginner"],
            );
          return q("INSERT INTO technologies (tech_name) VALUES (?)", [
            name,
          ]).then((r) =>
            q(
              "INSERT INTO student_technologies (basic_id,tech_id,level) VALUES (?,?,?)",
              [id, r.insertId, level || "Beginner"],
            ),
          );
        })
        .then(() => insertOneTech(index + 1));
    };
    return insertOneTech(0);
  });

  // 6. Rebuild reference_contacts
  const refValues = [
    [id, name1, contact1, relation1],
    [id, name2, contact2, relation2],
  ].filter((v) => v[1]);

  const updateRef = q("DELETE FROM reference_contacts WHERE basic_id=?", [
    id,
  ]).then(() =>
    refValues.length
      ? q(
        "INSERT INTO reference_contacts (basic_id,name,contact_number,relation) VALUES ?",
        [refValues],
      )
      : Promise.resolve(),
  );

  // 7. Update preferences
  const updatePref = q(
    `INSERT INTO preferences (basic_id,preferred_location,notice_period,department,expected_ctc)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
     preferred_location=VALUES(preferred_location), notice_period=VALUES(notice_period),
     department=VALUES(department), expected_ctc=VALUES(expected_ctc)`,
    [id, preferred_location, notice_period, department, expected_ctc],
  );

  Promise.all([
    updateBasic,
    updateEdu,
    updateWork,
    updateLang,
    updateTech,
    updateRef,
    updatePref,
  ])
    .then(() => res.redirect("/applicants"))
    .catch((err) => {
      console.log(err);
      res.send("DB Error during update");
    });
});

app.post('/delete/:id', (req, res) => {
  const id = req.params.id;

  dbconn.query('DELETE FROM education_details WHERE student_id = ?', [id], (err) => {
    if (err) return res.send(err);

    dbconn.query('DELETE FROM work_experience WHERE basic_id = ?', [id], (err) => {
      if (err) return res.send(err);

      dbconn.query('DELETE FROM student_languages WHERE basic_id = ?', [id], (err) => {
        if (err) return res.send(err);

        dbconn.query('DELETE FROM student_technologies WHERE basic_id = ?', [id], (err) => {
          if (err) return res.send(err);

          dbconn.query('DELETE FROM reference_contacts WHERE basic_id = ?', [id], (err) => {
            if (err) return res.send(err);

            dbconn.query('DELETE FROM preferences WHERE basic_id = ?', [id], (err) => {
              if (err) return res.send(err);

              dbconn.query('DELETE FROM basic_table WHERE basic_id = ?', [id], (err) => {
                if (err) return res.send(err);

                res.redirect('/applicants');
              });
            });
          });
        });
      });
    });
  });
});

app.post("/view/:id", (req, res) => {
  const id = req.params.id;

  dbconn.query("SELECT * FROM basic_table WHERE basic_id = ?", [id], (err, basicRows) => {
    if (err) return res.send("DB Error");
    if (!basicRows.length) return res.send("Applicant not found");

    // 2. Get education details
    dbconn.query("SELECT * FROM education_details WHERE student_id = ?", [id], (err2, education) => {
      if (err2) return res.send("DB Error");

      // 3. Get work experience
      dbconn.query("SELECT * FROM work_experience WHERE basic_id = ?", [id], (err3, workexp) => {
        if (err3) return res.send("DB Error");

        // 4. Get languages
        dbconn.query("SELECT * FROM student_languages WHERE basic_id = ?", [id], (err4, languages) => {
          if (err4) return res.send("DB Error");

          // 5. Get technologies (with JOIN)
          dbconn.query(
            `SELECT st.*, t.tech_name, st.level FROM student_technologies st
             JOIN technologies t ON st.tech_id = t.tech_id
             WHERE st.basic_id = ?`,
            [id],
            (err5, technologies) => {
              if (err5) return res.send("DB Error");

              // 6. Get references
              dbconn.query("SELECT * FROM reference_contacts WHERE basic_id = ?", [id], (err6, references) => {
                if (err6) return res.send("DB Error");

                // 7. Get preferences (last one)
                dbconn.query("SELECT * FROM preferences WHERE basic_id = ?", [id], (err7, prefRows) => {
                  if (err7) return res.send("DB Error");

                  // All data loaded - render
                  res.render("view_app", {
                    basic: basicRows[0],
                    education,
                    workexp,
                    languages,
                    technologies,
                    references,
                    preferences: prefRows[0] || {},
                  });
                });
              });
            }
          );
        });
      });
    });
  });
})

app.get("/search", (req, res) => {
  let search = req.query.search || "%%";
  console.log(search)

  dbconn.query(

  )
})
// Start server
app.listen(5000, () => {
  console.log(`http://localhost:5000`);
});
