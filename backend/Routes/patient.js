require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const Patient = require('../Models/patient');
const Doctor = require('../Models/doctor');
const Report = require('../Models/report');

// Sign-up for patient
router.post('/register',
    [
        check("name", "Please enter a valid name").notEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").notEmpty(),
        check("contact_number", "Please enter a valid contact_number").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const response = {
                ok: false,
                data: {
                },
                err: {
                    status: 400,
                    msg: errors.errors[0].msg
                }
            }
            return res.status(400).send(response);
        }

        try {
            const existedDoctor = await Doctor.findOne({ email: req.body.email });
            const existedPatient = await Patient.findOne({ email: req.body.email });

            if (existedDoctor || existedPatient) {
                const response = {
                    ok: false,
                    data: {
                    },
                    err: {
                        status: 400,
                        msg: "email is already in use please try another email"
                    }
                }
                return res.status(400).send(response);
            }
            
            const { password: plainTextPassword } = req.body;

            const salt = await bcrypt.genSaltSync(10);
            const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

            const patient = new Patient({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                address: req.body.address,
                city: req.body.city,
                contact_number: req.body.contact_number,
            });

            const savedPatient = await patient.save();

            const response = {
                ok: true,
                data: {
                    status: 200,
                    msg: "User has been registered",
                    user: savedPatient
                },
                err: {
                }
            }
            res.send(response);
        } catch (err) {
            const response = {
                ok: false,
                data: {
                },
                err: {
                    status: 400,
                    msg: err.message
                }
            }
            console.log(response);
            res.status(400).send(response);
        }
    }
);

// Sign-in for patient
router.post("/login",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const response = {
                ok: false,
                data: {
                },
                err: {
                    status: 400,
                    msg: errors.errors[0].msg
                }
            }
            return res.status(400).send(response);
        }

        try {
            const patient = await Patient.findOne({ email: req.body.email });
            if (!patient) {
                const response = {
                    ok: false,
                    data: {
                    },
                    err: {
                        status: 400,
                        msg: "Patient is not registered"
                    }
                }
                return res.status(400).send(response);
            }

            const validatePASSWORD = await bcrypt.compare(req.body.password, patient.password);
            console.log(validatePASSWORD);
            if (!validatePASSWORD) {
                const response = {
                    ok: false,
                    data: {
                    },
                    err: {
                        status: 400,
                        msg: "Password is not valid"
                    }
                }
                return res.status(400).send(response);
            }

            const response = {
                ok: true,
                data: {
                    status: 200,
                    msg: "Patient has been Logged In",
                    patient: patient,
                },
                err: {
                }
            }
            return res.status(200).send(response);

        } catch (err) {
            const response = {
                ok: false,
                data: {
                },
                err: {
                    status: 400,
                    msg: err.message
                }
            }
            console.log(response);
            res.status(400).send(response);
        }
    });

// add report for given patiend-id

router.post('/addreport', async (req, res) => {
    try{
        const report = new Report({
            patient: req.body._id,
            bloodPressure: req.body.bloodPressure,
            bloodSugar: req.body.bloodSugar,
            temperature: req.body.temperature,
            pulseRate: req.body.pulseRate
        });

        console.log(report);

        await report.save();
        const patient = await Patient.findById({_id: report.patient});
        patient.reports.push(report);
        await patient.save();

        console.log(patient);

        res.status(200).json({ok:true, data: report});
    }
    catch(err){
        console.log(err);
        res.status(400).json({ok:false, err: err});
    }

});

// get all report for requested email-id.
router.get('/getreports', async(req, res) => {
    try{
        const patient = await Patient.findOne({email: req.body.email});
        console.log(patient);
        const report_list = await Report.find({ _id : {$in : patient.reports}});

        res.status(200).json({ok: true, report_list});
    }
    catch(err){
        console.log(err);
        res.status(400).json({ok:false, err: err});
    }
});

module.exports = router;