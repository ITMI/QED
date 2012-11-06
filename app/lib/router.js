module.exports = Backbone.Router.extend({
    targetEl: "#mainDiv",
    routes:{
        '':'home_view',
        'twoD/:f1/:f2':'twod_view',
        'v/*uri/:view_name':'viewsByUri'
    },

    initialize: function(options) {
        if (options) _.extend(this, options);

        this.$el = $(this.targetEl);
    },

    views: {
        "grid": require("../views/grid_view"),
        "circ": require("../views/circvis_view"),
        "heat": require("../views/oncovis_view"),
        "graph": require("../views/graphtree_view"),
        "pwpv": require("../views/pwpv_view"),
        "twoD": require("../views/2D_Distribution_view"),
        "kde": null,
        "parcoords": require("../views/parcoords_view")
    },

    initTopNavBar:function() {
        var TopNavBar = require('../views/topbar_view');
        var topnavbar = new TopNavBar();
        $('#navigation-container').append(topnavbar.render().el);

        var DataMenuView = require("../views/data_menu");
        var section_ids = _.without(_.keys(qed.Datamodel.attributes), "url");
        _.each(section_ids, function(section_id) {
            var dataMenuView = new DataMenuView({ "section": qed.Datamodel.get(section_id) });
            $(".data-menu").append(dataMenuView.render().el);
            dataMenuView.on("select-data-item", function(selected) {
                var modalConfig = _.extend({ sectionId: section_id }, selected);
                var DataMenuModal = require("../views/data_menu_modal");
                var dataMenuModal = new DataMenuModal(modalConfig);
                $('body').append(dataMenuModal.render().el);
            });
        });

        var CloudStorageView = require("../views/cloud_storage_view");
        var csview = new CloudStorageView({ $navbar:$('#navigation-container') });
        $(document.body).append(csview.render().el);
    },

    twod_view:function (label1, label2) {
        var TwoD = qed.Views.twoD;
        var FL = require('../models/featureList');
        var fl = new FL({
            websvc:'/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons&IDs=',
            feature_list:[label1, label2]
        });
        var twoDView = new TwoD({collection:fl});
        fl.fetch();
        this.$el.html(twoDView.render().el);
    },

    home_view:function () {
        var HomeView = require('../views/home_view');
        var homeView = new HomeView();
        this.$el.html(homeView.render().el);
    },

    viewsByUri: function(uri, view_name, options) {
        var parts = uri.split("/");
        var data_root = parts[0];
        var analysis_id = parts[1];
        var dataset_id = parts[2];
        var model_unit = qed.Datamodel.get(data_root)[analysis_id];
        var catalog = model_unit.catalog;
        var catalog_unit = catalog[dataset_id];
        var modelName = catalog_unit.model;
        var Model = qed.Models[modelName];

        var model_optns = {
            "data_uri": "svc/data/" + uri,
            "analysis_id": analysis_id,
            "dataset_id": dataset_id,
            "model_unit": model_unit,
            "catalog_unit": catalog_unit
        };
        qed.FetchAnnotations(dataset_id);

        var model = new Model(model_optns);
        _.defer(function() {
            model.fetch({
                success:function () {
                    if (model.make_copy) model.make_copy(Model, model_optns);
                    model.trigger('load');
                }
            });
        });

        var view_options = _.extend({"model":model}, (model_unit.view_options || {}), (options || {}));

        var ViewClass = qed.Views[view_name];
        var view = new ViewClass(view_options);

        var NewWindowTemplate = require("../views/templates/new_window_template");
        this.$el.append(NewWindowTemplate({ "id": "w_" + dataset_id, "title": catalog_unit.label || dataset_id, "url": uri }));


        var newwindow = this.$el.find("#w_" + dataset_id);
        newwindow.draggable({ scroll: true, handle: "h5" });
        newwindow.find(".content-item").html(view.render().el);
    }
});
