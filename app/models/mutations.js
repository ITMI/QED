module.exports = Backbone.Model.extend({
    initialize:function (options) {
        _.extend(this, options);
    },

    url:function () {
        return "svc/" + this.catalog_unit.service + "?cancer=BLAH";
    }

});