const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @route POST /api/land/parcel/register
 * @desc Register a new land parcel deed in the database
 */
router.post("/parcel/register", async (req, res) => {
    try {
        const { parcelId, ownerWallet, legalDescriptionHash, physicalLocation } = req.body;
        
        if (!parcelId || !ownerWallet || !legalDescriptionHash || !physicalLocation) {
            return res.status(400).json({ success: false, error: "Missing required land registration parameters" });
        }

        const query = `
            INSERT INTO parcels (parcel_id, owner_wallet, legal_description_hash, physical_location, status)
            VALUES ($1, $2, $3, $4, 'Active') RETURNING *;
        `;
        const values = [parcelId, ownerWallet, legalDescriptionHash, physicalLocation];
        const result = await db.query(query, values);

        res.status(201).json({ success: true, parcel: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/land/parcel/transfer
 * @desc Update parcel ownership in the database following an on-chain transfer
 */
router.post("/parcel/transfer", async (req, res) => {
    try {
        const { parcelId, currentOwner, newOwner } = req.body;

        const query = `
            UPDATE parcels 
            SET owner_wallet = $1, updated_at = CURRENT_TIMESTAMP
            WHERE parcel_id = $2 AND owner_wallet = $3 RETURNING *;
        `;
        const values = [newOwner, parcelId, currentOwner];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, error: "Unauthorized transfer or invalid parcel ID/owner" });
        }

        res.status(200).json({ success: true, updatedParcel: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
