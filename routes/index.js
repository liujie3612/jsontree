var express = require('express');
var router = express.Router();

/* GET home page. */

router.get(/^((?!(?:\/.config.*)).)*$/, function (req, res) {
    res.render('index', res.locals);
});

module.exports = router;

