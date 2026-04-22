const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();
app.use(cors());
app.use(express.json());

const FILE = "database.json";

function readData() {
  return JSON.parse(fs.readFileSync(FILE));
}

function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// تسجيل طبيب
app.post("/register-doctor", async (req, res) => {
  const data = readData();

  const exist = data.doctors.find(d => d.email === req.body.email);
  if (exist) {
    return res.send("هذا الإيميل مسجل من قبل");
  }

const hashedPassword = await bcrypt.hash(req.body.password, 10);

 const doctor = {
  id: Date.now(),
  name: req.body.name,
  email: req.body.email,
  password: hashedPassword,
  phone: req.body.phone,      // ✅ أضف هذا
  specialty: req.body.specialty,
  location: req.body.location,
  current_number: 0,
  payment_status: "unpaid"
};

  data.doctors.push(doctor);
  writeData(data);

  res.send("تم تسجيل الطبيب");
});

// تسجيل الدخول
app.post("/login", async (req, res) => {
  const data = readData();

  const doctor = data.doctors.find(
    d => d.email === req.body.email
  );

  if (!doctor) {
    return res.json({ success: false });
  }

  const isMatch = await bcrypt.compare(req.body.password, doctor.password);

  if (isMatch) {
    res.json({ success: true, id: doctor.id });
  } else {
    res.json({ success: false });
  }
});

// عرض الأطباء (فقط المدفوعين)
app.get("/doctors", (req, res) => {
  const data = readData();
const now = Date.now();

data.doctors.forEach(doc => {
  if (doc.payment_date) {
    const diff = now - new Date(doc.payment_date).getTime();

    if (diff > 30 * 24 * 60 * 60 * 1000) {
      doc.payment_status = "unpaid";
    }
  }
});

  const visible = data.doctors.filter(d => d.payment_status === "paid");

const safe = data.doctors.map(d => ({
  id: d.id,
  name: d.name,
  specialty: d.specialty,
  location: d.location,
  current_number: d.current_number || 0
}));

res.json(safe);

res.json(safe);});

// كل الأطباء (للأدمن)
app.get("/all-doctors", (req, res) => {
  if (req.headers.authorization !== "MY_SECRET_987654") {
    return res.status(403).send("ممنوع");
  }

  const data = readData();
  res.json(data.doctors);
});
// تفعيل
app.post("/pay/:id", (req, res) => {
  const data = readData();

  const doc = data.doctors.find(d => d.id == req.params.id);
  if (doc) {
  doc.payment_status = "paid";
  doc.payment_date = new Date();
}

  writeData(data);
  res.send("تم التفعيل");
});

// إيقاف
app.post("/hide/:id", (req, res) => {
  const data = readData();

  const doc = data.doctors.find(d => d.id == req.params.id);
  if (doc) doc.payment_status = "unpaid";

  writeData(data);
  res.send("تم الإيقاف");
});

// حجز
app.post("/book-appointment", (req, res) => {
  const data = readData();

  const appo = {
    id: Date.now(),
    doctorId: req.body.doctorId,
    patientName: req.body.patientName,
    status: "pending",
    number: null
  };

  data.appointments.push(appo);
  writeData(data);

  res.send("تم الحجز");
});

// مواعيد طبيب
app.get("/appointments/:doctorId", (req, res) => {
  const data = readData();

  const list = data.appointments.filter(
    a => a.doctorId == req.params.doctorId
  );

  const safe = list.map(a => ({
  status: a.status,
  number: a.number
}));

res.json(safe);
});

// قبول
app.post("/accept/:id", (req, res) => {
  const data = readData();

  const appo = data.appointments.find(a => a.id == req.params.id);

  if (!appo) return res.send("not found");

  appo.status = "accepted";

  const doctor = data.doctors.find(d => d.id == appo.doctorId);

  if (!doctor.last_number) doctor.last_number = 0;

  doctor.last_number++;
  appo.number = doctor.last_number;

  writeData(data);

  res.send("تم القبول");
});
app.post("/reject/:id", (req, res) => {
  const data = readData();

  const appo = data.appointments.find(a => a.id == req.params.id);
  if (!appo) return res.send("not found");

  appo.status = "rejected";

  writeData(data);
  res.send("تم الرفض");
});
// التالي
app.post("/next-patient/:doctorId", (req, res) => {
  const data = readData();

  const doctor = data.doctors.find(
    d => d.id == req.params.doctorId
  );

  if (!doctor) return res.send("not found");

  doctor.current_number = (doctor.current_number || 0) + 1;

  writeData(data); // 🔥 أهم سطر

  res.send("تم التمرير");
});
app.use(express.static(__dirname));

app.post("/admin-login", (req, res) => {
  const { email, password } = req.body;

  if (email === "bassmatani72@gmail.com" && password === "ILINAbeka") {
    res.json({ success: true, token: "admin123" });
  } else {
    res.json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});
