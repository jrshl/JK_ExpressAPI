const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/:category', async (req, res) => {
    try {
      const { category } = req.params;

      const [results] = await pool.query(
        'SELECT id, name, image_url AS image, rarity FROM cat_images WHERE category = ?',
        [category]
      );

      res.json(results);
    } catch (err) {
      console.error("Error in cat route:", err);
      res.status(500).json({ error: "Failed to load cat images" });
    }
  });

  return router;
};
