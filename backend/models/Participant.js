// models/Participant.js
const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  college: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  eventId: { type: String }, // if multiple events
  registeredAt: { type: Date, default: Date.now },
  registrationQRCode: { type: String }, // DataURI (png) or URL to file storage
  approved: { type: Boolean, default: false },
  entryPassQRCode: { type: String }, // DataURI or URL
});

module.exports = mongoose.model('Participant', ParticipantSchema);
