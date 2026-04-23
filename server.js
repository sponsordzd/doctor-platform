const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://sponsordzd17_db_user:VbsudswfJGLLNpzC@cluster0.9coxxyx.mongodb.net/?appName=Cluster0");

const Doctor = mongoose.model("Doctor", {
  name: String,
  email: String,
  password: String,
  phone: String,
  specialty: String,
  location: String,
  current_number: Number,
  last_number: Number
});
const Appointment = mongoose.model("Appointment", {
  doctorId: String,
  patientName: String,
  status: String,
  number: Number
});
const app = express();
app.use(cors());
app.use(express.json());

// =========================
// تسجيل طبيب
// =========================
app.post("/register-doctor", async (req, res) => {
  try {

    const exist = await Doctor.findOne({ email: req.body.email });
    if (exist) return res.send("هذا الإيميل مسجل");

    const hashed = await bcrypt.hash(req.body.password, 10);

    const doctor = new Doctor({
      name: req.body.name,
      email: req.body.email,
      password: hashed,
      phone: req.body.phone,
      specialty: req.body.specialty,
      location: req.body.location,
      current_number: 0,
      last_number: 0
    });

    await doctor.save();

    res.send("تم تسجيل الطبيب");

  } catch (err) {
    console.log("ERROR REGISTER:", err);
    res.status(500).send("error");
  }
});

// =========================
// تسجيل الدخول
// =========================
app.post("/login", async (req, res) => {

const doctor = await Doctor.findOne({ email: req.body.email });  if (!doctor) return res.json({ success: false });

  const ok = await bcrypt.compare(req.body.password, doctor.password);

  if (ok) res.json({ success: true, id: doctor._id });
  else res.json({ success: false });
});

// =========================
// عرض الأطباء
// =========================
app.get("/doctors", async (req, res) => {

  const doctors = await Doctor.find();

  const safe = doctors.map(d => ({
    id: d._id,
    name: d.name,
    specialty: d.specialty,
    location: d.location,
    current_number: d.current_number || 0
  }));

  res.json(safe);
});

// =========================
// حجز
// =========================
app.post("/book-appointment", (req, res) => {

  app.post("/book-appointment", async (req, res) => {

  const appo = new Appointment({
    doctorId: req.body.doctorId,
    patientName: req.body.patientName.trim().toLowerCase(),
    status: "pending",
    number: null
  });

  await appo.save();

  res.send("تم الحجز");
});

// =========================
// مواعيد طبيب
// =========================
app.get("/appointments/:doctorId", (req, res) => {

  app.get("/appointments/:doctorId", async (req, res) => {

  const list = await Appointment.find({ doctorId: req.params.doctorId });

  const safe = list.map(a => ({
    id: a._id,
    patientName: a.patientName,
    status: a.status,
    number: a.number
  }));

  res.json(safe);
});

// =========================
// موعد المريض (مهم جداً)
// =========================
app.get("/my-appointment/:doctorId/:name", (req, res) => {

  const name = req.params.name.trim().toLowerCase();

  app.get("/my-appointment/:doctorId/:name", async (req, res) => {

  const name = req.params.name.trim().toLowerCase();

  const appo = await Appointment.findOne({
    doctorId: req.params.doctorId,
    patientName: name
  });

  res.json(appo);
});

// =========================
// قبول
// =========================
app.post("/accept/:id", (req, res) => {

  app.post("/accept/:id", async (req, res) => {

  const appo = await Appointment.findById(req.params.id);
  if (!appo) return res.send("not found");

  appo.status = "accepted";

  const doctor = await Doctor.findById(appo.doctorId);

  doctor.last_number++;
  appo.number = doctor.last_number;

  await doctor.save();
  await appo.save();

  res.send("تم القبول");
});

// =========================
// رفض
// =========================
app.post("/reject/:id", (req, res) => {

  app.post("/reject/:id", async (req, res) => {

  const appo = await Appointment.findById(req.params.id);
  if (!appo) return res.send("not found");

  appo.status = "rejected";
  await appo.save();

  res.send("تم الرفض");
});

// =========================
// التالي
// =========================
app.post("/next-patient/:doctorId", (req, res) => {

  app.post("/next-patient/:doctorId", async (req, res) => {

  const doctor = await Doctor.findById(req.params.doctorId);
  if (!doctor) return res.send("not found");

  doctor.current_number++;
  await doctor.save();

  res.send("تم التمرير");
});
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.listen(3000, () => {
  console.log("Server running");
});
