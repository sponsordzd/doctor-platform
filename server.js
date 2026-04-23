const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// قراءة
function readData() {
  if (!fs.existsSync(FILE)) {
    return { doctors: [], appointments: [] };
  }
  return JSON.parse(fs.readFileSync(FILE));
}

// كتابة
function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// =========================
// تسجيل طبيب
// =========================
app.post("/register-doctor", async (req, res) => {
  const data = readData();

  const exist = data.doctors.find(d => d.email === req.body.email);
  if (exist) return res.send("هذا الإيميل مسجل");

  const hashed = await bcrypt.hash(req.body.password, 10);

  const doctor = {
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    password: hashed,
    phone: req.body.phone,
    specialty: req.body.specialty,
    location: req.body.location,
    current_number: 0,
    last_number: 0,
    payment_status: "paid" // نخلوه ظاهر مباشرة
  };

  data.doctors.push(doctor);
  writeData(data);

  res.send("تم تسجيل الطبيب");
});

// =========================
// تسجيل الدخول
// =========================
app.post("/login", async (req, res) => {
  const data = readData();

  const doctor = data.doctors.find(d => d.email === req.body.email);
  if (!doctor) return res.json({ success: false });

  const ok = await bcrypt.compare(req.body.password, doctor.password);

  if (ok) res.json({ success: true, id: doctor.id });
  else res.json({ success: false });
});

// =========================
// عرض الأطباء
// =========================
app.get("/doctors", (req, res) => {
  const data = readData();

  const safe = data.doctors.map(d => ({
    id: d.id,
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
  const data = readData();

  const appo = {
    id: Date.now(),
    doctorId: req.body.doctorId,
    patientName: req.body.patientName.trim().toLowerCase(),
    status: "pending",
    number: null
  };

  data.appointments.push(appo);
  writeData(data);

  res.send("تم الحجز");
});

// =========================
// مواعيد طبيب
// =========================
app.get("/appointments/:doctorId", (req, res) => {
  const data = readData();

  const list = data.appointments
    .filter(a => a.doctorId == req.params.doctorId)
    .map(a => ({
      id: a.id,
      patientName: (a.patientName || "").trim().toLowerCase(),
      status: a.status,
      number: a.number
    }));

  res.json(list);
});

// =========================
// موعد المريض (مهم جداً)
// =========================
app.get("/my-appointment/:doctorId/:name", (req, res) => {
  const data = readData();

  const name = req.params.name.trim().toLowerCase();

  const appo = data.appointments.find(
    a =>
      a.doctorId == req.params.doctorId &&
      a.patientName === name
  );

  res.json(appo || null);
});

// =========================
// قبول
// =========================
app.post("/accept/:id", (req, res) => {
  const data = readData();

  const appo = data.appointments.find(a => a.id == req.params.id);
  if (!appo) return res.send("not found");

  appo.status = "accepted";

  const doctor = data.doctors.find(d => d.id == appo.doctorId);

  doctor.last_number++;
  appo.number = doctor.last_number;

  writeData(data);

  res.send("تم القبول");
});

// =========================
// رفض
// =========================
app.post("/reject/:id", (req, res) => {
  const data = readData();

  const appo = data.appointments.find(a => a.id == req.params.id);
  if (!appo) return res.send("not found");

  appo.status = "rejected";

  writeData(data);

  res.send("تم الرفض");
});

// =========================
// التالي
// =========================
app.post("/next-patient/:doctorId", (req, res) => {
  const data = readData();

  const doctor = data.doctors.find(d => d.id == req.params.doctorId);
  if (!doctor) return res.send("not found");

  doctor.current_number++;

  writeData(data);

  res.send("تم التمرير");
});
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.listen(3000, () => {
  console.log("Server running");
});
