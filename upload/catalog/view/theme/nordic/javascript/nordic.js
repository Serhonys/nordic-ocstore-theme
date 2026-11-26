/* NORDIC — storefront behaviour. Loaded after common.js. */
(function ($) {
  var dict = {
    ru: { filters: "Фильтры", close: "Закрыть", catalog: "Каталог" },
    uk: { filters: "Фільтри", close: "Закрити", catalog: "Каталог" },
    en: { filters: "Filters", close: "Close", catalog: "Catalog" }
  };

  function langKey() {
    var code = (document.documentElement.lang || "en").toLowerCase();
    if (code.indexOf("ru") === 0) return "ru";
    if (code.indexOf("uk") === 0) return "uk";
    return "en";
  }

  function paintI18n() {
    var pack = dict[langKey()];
    $("[data-nt]").each(function () {
      var key = $(this).attr("data-nt");
      if (pack[key]) $(this).text(pack[key]);
    });
  }

  function openDrawer() {
    $("#column-left").addClass("is-open");
    $("#nt-overlay").addClass("is-open");
    $("body").addClass("nt-lock");
  }

  function closeDrawer() {
    $("#column-left").removeClass("is-open");
    $("#nt-overlay").removeClass("is-open");
    $("body").removeClass("nt-lock");
  }

  function applyView(mode) {
    var box = $("#nt-products");
    if (!box.length) return;
    box.attr("data-view", mode === "list" ? "list" : "grid");
    $("#grid-view, #list-view").removeClass("is-active");
    $("#" + (mode === "list" ? "list" : "grid") + "-view").addClass("is-active");
    try { localStorage.setItem("display", mode); } catch (e) {}
  }

  function refreshCartTotal(totalText) {
    var node = $("#cart-total");
    if (node.length) node.text(totalText);
  }

  $(function () {
    paintI18n();

    $("#list-view, #grid-view").off("click");
    $("#grid-view").on("click", function (e) {
      e.preventDefault();
      applyView("grid");
    });
    $("#list-view").on("click", function (e) {
      e.preventDefault();
      applyView("list");
    });
    var stored = "grid";
    try { stored = localStorage.getItem("display") || "grid"; } catch (e) {}
    applyView(stored);

    $(document).on("click", "#nt-open-filters", openDrawer);
    $(document).on("click", "#nt-overlay, [data-nt-close]", closeDrawer);

    $("#nt-seo-toggle").on("click", function () {
      var box = $("#nt-seo");
      var open = box.toggleClass("is-open").hasClass("is-open");
      $(this).find("[data-nt-seo]").text(open ? $(this).attr("data-less") : $(this).attr("data-more"));
    });

    $("#cart > button").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $("#cart").toggleClass("is-open");
    });
    $(document).on("click", function (e) {
      if (!$(e.target).closest("#cart").length) $("#cart").removeClass("is-open");
    });

    var menuBtn = $("#nt-catalog-btn");
    menuBtn.on("click", function (e) {
      e.preventDefault();
      $("#nt-catalog-panel").toggleClass("is-open");
    });
  });

  /* Keep #cart > button markup. common.js replaces it with a single span. */
  function cartRequest(url, data, reloadPage) {
    $.ajax({
      url: url,
      type: "post",
      data: data,
      dataType: "json",
      success: function (json) {
        $(".alert-dismissible, .text-danger").remove();
        if (json.redirect) {
          location = json.redirect;
          return;
        }
        if (json.success) {
          var anchor = $("#content").length ? $("#content").parent() : $("header");
          anchor.before('<div class="alert alert-success alert-dismissible"><span>' + json.success + '</span><button type="button" class="nt-alert-close" data-dismiss="alert">&times;</button></div>');
        }
        if (json.total) refreshCartTotal(json.total);
        if (reloadPage) {
          location = "index.php?route=checkout/cart";
          return;
        }
        $("#cart > ul").load("index.php?route=common/cart/info ul li");
        $("#cart").addClass("is-open");
      },
      error: function (xhr, ajaxOptions, thrownError) {
        alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
      }
    });
  }

  window.cart = {
    add: function (product_id, quantity) {
      cartRequest("index.php?route=checkout/cart/add", "product_id=" + product_id + "&quantity=" + (typeof quantity !== "undefined" ? quantity : 1), false);
    },
    update: function (key, quantity) {
      var onCart = getURLVar("route") === "checkout/cart" || getURLVar("route") === "checkout/checkout";
      cartRequest("index.php?route=checkout/cart/edit", "key=" + key + "&quantity=" + (typeof quantity !== "undefined" ? quantity : 1), onCart);
    },
    remove: function (key) {
      var onCart = getURLVar("route") === "checkout/cart" || getURLVar("route") === "checkout/checkout";
      cartRequest("index.php?route=checkout/cart/remove", "key=" + key, onCart);
    }
  };

  window.voucher.remove = function (key) {
    var onCart = getURLVar("route") === "checkout/cart" || getURLVar("route") === "checkout/checkout";
    cartRequest("index.php?route=checkout/cart/remove", "key=" + key, onCart);
  };

  var _wish = window.wishlist.add;
  window.wishlist.add = function (product_id) {
    $.ajax({
      url: "index.php?route=account/wishlist/add",
      type: "post",
      data: "product_id=" + product_id,
      dataType: "json",
      success: function (json) {
        $(".alert-dismissible").remove();
        if (json.redirect) {
          location = json.redirect;
          return;
        }
        if (json.success && $("#content").length) {
          $("#content").parent().before('<div class="alert alert-success alert-dismissible"><span>' + json.success + '</span><button type="button" class="nt-alert-close" data-dismiss="alert">&times;</button></div>');
        }
        if (json.total) {
          $("#wishlist-total").attr("title", json.total);
          var match = String(json.total).match(/(\d+)/);
          $("#wishlist-total .nt-count").text(match ? match[1] : json.total);
        }
      },
      error: function () {
        if (typeof _wish === "function") _wish(product_id);
      }
    });
  };

  window.compare.add = function (product_id) {
    $.ajax({
      url: "index.php?route=product/compare/add",
      type: "post",
      data: "product_id=" + product_id,
      dataType: "json",
      success: function (json) {
        $(".alert-dismissible").remove();
        if (json.success && $("#content").length) {
          $("#content").parent().before('<div class="alert alert-success alert-dismissible"><span>' + json.success + '</span><button type="button" class="nt-alert-close" data-dismiss="alert">&times;</button></div>');
        }
        if (json.total) {
          var match = String(json.total).match(/(\d+)/);
          $("#compare-total").text(match ? match[1] : json.total).attr("title", json.total);
        }
      }
    });
  };
})(window.jQuery);
