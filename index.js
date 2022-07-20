var url = 'https://reqres.in/api/users?page='
var column = [
  {
    title: 'Sequence',
    data: 'sequence',
  },
  {
    title: 'Id',
    data: 'id',
  },
  {
    title: 'Avatar',
    data: 'avatar',
    render: function (data, type, row) {
      return '<img height="10%" width="10%" src="' + data + '" alt="Avatar"/>'
    },
  },
  {
    title: 'First title',
    data: 'first_name',
  },
  {
    title: 'Last title',
    data: 'last_name',
  },
  {
    title: 'Email',
    data: 'email',
  },
]
var page_Length = 6
var total_pages = 2
var result = {
  page: 1,
  per_page: 6,
  total: 12,
  total_pages: 2,
  data: [
    {
      id: 1,
      email: 'george.bluth@reqres.in',
      first_name: 'George',
      last_name: 'Bluth',
      avatar: 'https://reqres.in/img/faces/1-image.jpg',
    },
    {
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    },
    {
      id: 3,
      email: 'emma.wong@reqres.in',
      first_name: 'Emma',
      last_name: 'Wong',
      avatar: 'https://reqres.in/img/faces/3-image.jpg',
    },
    {
      id: 4,
      email: 'eve.holt@reqres.in',
      first_name: 'Eve',
      last_name: 'Holt',
      avatar: 'https://reqres.in/img/faces/4-image.jpg',
    },
    {
      id: 5,
      email: 'charles.morris@reqres.in',
      first_name: 'Charles',
      last_name: 'Morris',
      avatar: 'https://reqres.in/img/faces/5-image.jpg',
    },
    {
      id: 6,
      email: 'tracey.ramos@reqres.in',
      first_name: 'Tracey',
      last_name: 'Ramos',
      avatar: 'https://reqres.in/img/faces/6-image.jpg',
    },
  ],
  support: {
    url: 'https://reqres.in/#support-heading',
    text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
  },
}
$.fn.dataTable.Api.register('clearPipeline()', function () {
  return this.iterator('table', function (settings) {
    settings.clearCache = true
  })
})
$.fn.dataTable.pipeline = function (opts) {
  // Configuration options
  var conf = $.extend(
    {
      pages: 2,
      url: '',
      data: null,
      method: 'GET', // Ajax HTTP method
    },
    opts
  )

  // Private variables for storing the cache
  var cacheLower = -1
  var cacheUpper = null
  var cacheLastRequest = null
  var cacheLastJson = null
  var cacheLastData = null

  return function (request, drawCallback, settings) {
    var ajax = false
    var requestStart = request.start
    var drawStart = request.start
    var requestLength = request.length
    var requestEnd = requestStart + requestLength
    var pageNumber = requestEnd / page_Length

    if (settings.clearCache) {
      // API requested that the cache be cleared
      ajax = true
      settings.clearCache = false
    } else if (
      cacheLower < 0 ||
      requestStart > cacheLower ||
      requestEnd > cacheUpper
    ) {
      // outside cached data - need to make a request
      ajax = true
    }
    // else if (
    //   JSON.stringify(request.order) !==
    //     JSON.stringify(cacheLastRequest.order) ||
    //   JSON.stringify(request.columns) !==
    //     JSON.stringify(cacheLastRequest.columns) ||
    //   JSON.stringify(request.search) !== JSON.stringify(cacheLastRequest.search)
    // ) {
    //   // properties changed (ordering, columns, searching)
    //   ajax = true
    // }

    // Store the request for checking next time around
    cacheLastRequest = $.extend(true, {}, request)

    if (ajax) {
      // Need data from the server
      if (requestStart < cacheLower) {
        requestStart = requestStart - requestLength * (conf.pages - 1)

        if (requestStart < 0) {
          requestStart = 0
        }
      }

      cacheLower = requestStart
      cacheUpper = requestStart + requestLength * conf.pages

      request.start = requestStart
      request.length = requestLength * conf.pages

      // Provide the same `data` options as DataTables.
      if (typeof conf.data === 'function') {
        // As a function it is executed with the data object as an arg
        // for manipulation. If an object is returned, it is used as the
        // data object to submit
        var d = conf.data(request)
        if (d) {
          $.extend(request, d)
        }
      } else if ($.isPlainObject(conf.data)) {
        // As an object, the data given extends the default
        $.extend(request, conf.data)
      }

      return $.ajax({
        type: conf.method,
        url: conf.url + pageNumber,
        data: request,
        dataType: 'json',
        cache: false,
        success: function (json) {
          json.recordsTotal = json.total
          json.recordsFiltered = json.total
          cacheLastData = $.merge($.merge([], cacheLastData || []), json.data)
          cacheLastJson = $.extend(true, {}, json)

          if (cacheLower != drawStart) {
            json.data.splice(0, drawStart - cacheLower)
          }
          if (requestLength >= -1) {
            json.data.splice(requestLength, json.data.length)
          }
          json.data = json.data.map(function (d, i) {
            d.sequence = i
            return d
          })
          drawCallback(json)
        },
      })
    } else {
      json = $.extend(true, {}, cacheLastJson)
      json.draw = request.draw // Update the echo for each response
      json.data = cacheLastData.slice(
        requestStart,
        requestStart + requestLength
      )
      json.page = pageNumber
      // json.data.splice(0, requestStart - cacheLower)
      // json.data.splice(requestLength, json.data.length)

      drawCallback(json)
    }
  }
}
$.extend($.fn.dataTable.defaults, {
  searching: false,
  processing: false,
  serverSide: true,
  responsive: true,
  pageLength: page_Length,
  ajax: $.fn.dataTable.pipeline({
    url: url,
    pages: total_pages, // number of pages to cache
  }),
  dom: 'Btip', //Btlip
  buttons: ['csv'],
  columns: column,
  rowReorder: {
    dataSrc: 'sequence',
    selector: 'tr',
  },
  columnDefs: [{ visible: false, targets: 0 }],
})
$(document).ready(function () {
  var table_jq = $('#table_jq').DataTable()
})
