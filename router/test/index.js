import express from "express";
const Router = express.Router();

Router.get('/data', (req, res) => {
  res.status(200).json({ data: 'something ~(@.@)~' });
});

export default Router;