const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const qs = require("qs"); // required for form-urlencoded
const Lead = require("./models/Lead");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

app.post("/api/submit-lead", async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    // 1. Save to MongoDB
    const lead = new Lead({ name, email, phone });
    await lead.save();

    // 2. Prepare full CRM payload
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const crmPayload = {
      DataFrom: "T",
      ApiKey: process.env.CRM_API_KEY,
      EnquiryDate: today,
      Salutation: "",
      FirstName: name,
      MiddleName: "",
      LastName: "",
      MobileNo: phone,
      Email: email,
      Preferences: "2 BHK", 
      Source: "Digitals",
      SourceDetail: "WebSite",
      AgeRange: "",
      CurrentLivingPlace: "",
      NativePlace: "",
      Industry: "",
      CompanyName: "",
      Budget: "",
      PossessionReq: "",
      BuyingPurpose: "",
      BookingPlanWithin: "",
      PreferredBankForLoan: "",
      Country: "",
      State: "",
      City: "",
      PinCode: "",
      DOB: "",
      PanNo: "",
      PreferredLocation: "",
      AlternativeMobileNo: "",
      WhatsAppNo: "",
      Remark: "Lead from landing page",
    };

    // 3. Send to CRM
    const crmRes = await axios.post(
      process.env.CRM_API_URL,
      qs.stringify(crmPayload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // 4. Check CRM response
    if (crmRes.data.code === 200) {
      res.status(200).json({ message: "Successfully added to CRM!" });
    } else {
      console.error("❌ CRM response error:", crmRes.data);
      res.status(200).json({
        message: `Saved to DB. CRM Error: ${crmRes.data.message}`,
      });
    }
  } catch (error) {
    console.error("❌ Submit error:", error.message);
    res.status(500).json({ message: "Error saving or sending to CRM." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
