const validator = require('email-validator');

const validateEmail = email => {
    return validator.validate(email);
}

module.exports = {
    validateEmail,
};

