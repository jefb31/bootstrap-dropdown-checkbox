/*

Copyright (C) 2013 Acquisio Inc. V0.1.1

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
!function ($) {

  "use strict"

  // **********************************
  // Templates
  // **********************************
  var template = '\
    <button class="dropdown-checkbox-toggle" data-toggle="dropdown-checkbox" href="#">Dropdown trigger</button>\
    <div class="dropdown-checkbox-content">\
      <div class="dropdown-checkbox-header">\
        <input class="checkbox-all" type="checkbox"><input type="text" placeholder="Search" class="search"/>\
      </div>\
      <ul class="dropdown-checkbox-menu"></ul>\
    </div>'
  var templateOption = '<li><div class="layout"><input type="checkbox"/><label></label></div></li>'
  var templateNoResult = '<li><div class="layout"><label>No results.</label></div></li>'

  // **********************************
  // Constructor
  // **********************************
  var DropdownCheckbox = function(element, options) {
    // Create dropdown-checkbox
    $(element).html(template)
    $(element).addClass("dropdown-checkbox")

    this.$element = $(element).find(".dropdown-checkbox-toggle")
    this.$parent = $(element)
    this.$list = this.$parent.find("ul")
    this.elements = []

    // Set options if exist
    if (typeof options === "object") {
      this.$element.text(options.title)
      this.$element.addClass(options.btnClass)
      this.autosearch = options.autosearch
      this.elements = options.data || []
      this._sort = options.sort || this._sort
      this.sortOptions = options.sortOptions
    }

    // Open panel when the link is clicked
    this.$element.on("click.dropdown-checkbox.data-api", $.proxy(function() {
      this.$parent.siblings().removeClass("open")
      this.$parent.toggleClass("open")
      return false
    }, this))

    // Check or uncheck all checkbox
    this.$parent.find(".checkbox-all").on("change.dropdown-checkbox.data-api", $.proxy(function(event) {
      this.onClickCheckboxAll(event)
    }, this))

    // Events on document
    // - Close panel when click out
    // - Catch keyup events in search box
    // - Catch click on checkbox
    $(document)
      .on('click.dropdown-checkbox.data-api', $.proxy(function () { this.$parent.removeClass('open') }, this))
      .on('keyup.dropdown-checkbox.data-api', '.dropdown-checkbox-header .search',
        $.proxy(DropdownCheckbox.prototype.onKeyup, this)
      )
      .delegate("li input[type=checkbox]", "click.dropdown-checkbox.data-api", $.proxy(this.onClickCheckbox, this))

    this.reset(this.elements)
  }

  // **********************************
  // DropdownCheckbox object
  // **********************************
  DropdownCheckbox.prototype = {
    constructor: DropdownCheckbox,

    // ----------------------------------
    // Methods to override
    // ----------------------------------
    _sort: function(elements) {
      return elements
    },

    // ----------------------------------
    // Internal methods
    // ----------------------------------
    _removeElements: function(ids) {
      this._isValidArray(ids)
      var tmp = []
          , toAdd = true
      for (var i = 0 ; i < this.elements.length ; i++) {
        for (var j = 0 ; j < ids.length ; j++) {
          if (ids[j] === parseInt(this.elements[i].id, 10)) toAdd = false
        }
        if (toAdd) tmp.push(this.elements[i])
        toAdd = true
      }
      this.elements = tmp
    },

    _setAllCheckBox: function(isChecked) {
      var results = []
      this.$parent.find("li").each($.proxy(function(index, item) {
        if ($(item).find("input[type=checkbox]").prop("checked") == isChecked) {
          results.push(parseInt($(item).data("id"), 10))
        }
      }, this))
      return results
    },

    _isValidArray: function(arr) {
      if (!$.isArray(arr)) throw "[DropdownCheckbox] Requiert an array."
    },

    _findMatch: function(word, elements) {
      var results = []
      for (var i = 0 ; i < elements.length ; i++) {
        if (elements[i].label.toLowerCase().search(word.toLowerCase()) !== -1) results.push(elements[i])
      }
      return results
    },

    _setCheckbox: function(isChecked, id) {
      for(var i = 0 ; i < this.elements.length ; i++) {
        if (id == this.elements[i].id) { 
          this.elements[i].isChecked = isChecked
          break
        }
      }
    },

    _refreshCheckboxAll: function() {
      var $elements = this.$element.parents(".dropdown-checkbox").find("ul li input[type=checkbox]")
          , willChecked
      $elements.each(function() { willChecked = willChecked || $(this).prop("checked") })
      this.$element.parents(".dropdown-checkbox").find(".checkbox-all").prop("checked", willChecked)
    },

    _resetSearch: function() {
      this.$parent.find(".search").val("")
      this.reset(this.elements)
    },

    // ----------------------------------
    // Event methods
    // ----------------------------------
    onKeyup: function(event) {
      var keyCode = event.keyCode
          , word = $(event.target).val()

      if (word.length <= 1 && keyCode === 8) return this.reset(this.elements)
      if (keyCode === 27) return this._resetSearch()

      if (this.autosearch || keyCode === 13) {
        var results = this._findMatch(word, this.elements)
        if (results.length > 0) return this.reset(results)
        return this.$list.html(templateNoResult)
      }
    },

    onClickCheckboxAll: function(event) {
      var isChecked = $(event.target).is(":checked")
          , $elements = this.$parent.find("ul li")
          , self = this
      $elements.each(function() {
        $(this).find("input[type=checkbox]").prop("checked", isChecked)
        self._setCheckbox(isChecked, $(this).data("id"))
      })
    },

    onClickCheckbox: function(event) {
      this._setCheckbox($(event.target).prop("checked"), $(event.target).parent().parent().data("id"))
      this._refreshCheckboxAll()
    },

    // ----------------------------------
    // External methods
    // ----------------------------------
    checked: function() {
      return this._setAllCheckbox(true)
    },

    unchecked: function() {
      return this._setAllCheckbox(false)
    },

    append: function(elements) {
      this._isValidArray(elements)
      elements = this._sort(elements, this.sortOptions)
      for (var i = 0 ; i < elements.length ; i++) { this.appendOne(elements[i]) }
    },

    appendOne: function(item) {
      var id = item.id
          , label = item.label
          , isChecked = item.isChecked
          , uuid = new Date().getTime() * Math.random()

      this.$list.append(templateOption)
      var $last = this.$list.find("li").last()
      $last.data("id", id)

      var $checkbox = $last.find("input")
      $checkbox.attr("id", uuid)
      if (isChecked) $checkbox.attr("checked", "checked")

      var $label = $last.find("label")
      $label.text(label)
      $label.attr("for", uuid)
    },

    remove: function(ids) {
      this._isValidArray(ids)
      this._removeElements(ids)
      this.reset(this.elements)
    },

    reset: function(elements) {
      this._isValidArray(elements)
      this.$list.empty()
      this.append(elements)
      this._refreshCheckboxAll()
    }
  }

  // **********************************
  // Add DropdownCheckbox as plugin for JQuery
  // **********************************
  $.fn.dropdownCheckbox = function (option, more) {
    var $this = $(this)
        , data = $this.data('dropdownCheckbox')
        , options = typeof option == 'object' && option
    if (!data) $this.data('dropdownCheckbox', (data = new DropdownCheckbox(this, options)))
    if (typeof option == 'string') return data[option](more)
    return this
  }

  $.fn.dropdownCheckbox.Constructor = DropdownCheckbox

  $(document)
    .on('click.dropdown-checkbox.data-api', '.dropdown-checkbox-content', function (e) { e.stopPropagation() })

}(window.jQuery)