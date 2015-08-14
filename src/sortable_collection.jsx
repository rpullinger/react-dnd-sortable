var React            = require('react'),
    update           = require('react/lib/update'),
    clone            = require('react/addons').addons.cloneWithProps,
    dnd              = require('react-dnd'),
    DragSource       = dnd.DragSource,
    DropTarget       = dnd.DropTarget,
    DragDropContext  = dnd.DragDropContext,
    HTML5Backend     = require('react-dnd/modules/backends/HTML5');

var dragSource = {
  beginDrag: function (props) {
    console.log("begin dragging: ", props.x, "from start: ", props.startingPosition);
    console.log("begin dragging: ", props.x, "from next: ", props.nextPosition);
    return {
      x: props.x,
      startingPosition: props.startingPosition,
      nextPosition: props.nextPosition
    };
  },

  endDrag: function(props, monitor){
    if (monitor.didDrop()) {
      props.onDrop();
    } else {
      props.onCancel();
    }
  }
};

var dropTarget = {
  hover: function (props, monitor) {
    var sourceStartingPosition = monitor.getItem().startingPosition,
        sourceNextPosition     = monitor.getItem().nextPosition,
        targetStartingPosition = props.startingPosition,
        targetNextPosition     = props.nextPosition;

    if (sourceNextPosition !== targetNextPosition) {
      console.log("hover : source: ", monitor.getItem());
      console.log("hover : target: ", props);
      console.log("hover : sourceNextPosition: ", sourceNextPosition);
      console.log("hover : sourceStartingPosition: ", sourceStartingPosition);
      console.log("hover : targetStartingPosition: ", targetStartingPosition);
      props.onHover(sourceNextPosition, targetNextPosition);
    }
  }
};

function collectSource(connect, monitor) {
  return {
    connectDragSource: connect.dragSource()
  };
}

function collectTarget(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  };
}

var Item = React.createClass({
  render: function () {
    var connectSource = this.props.connectDragSource,
        connectTarget = this.props.connectDropTarget;

    return connectSource(connectTarget(
      clone(this.props.children, this.props)
    ));
  }
});

var Tmp          = DropTarget("X", dropTarget, collectTarget)(Item),
    SortableItem = DragSource("X", dragSource, collectSource)(Tmp);

var SortableCollection = React.createClass({
  propTypes: {
    type:           React.PropTypes.string,
    dragRef:        React.PropTypes.string,
    collection:     React.PropTypes.array,
    itemIdentifier: React.PropTypes.string, // they key to uniquely identify each item in collection
    onSorted:       React.PropTypes.func,
    children:       React.PropTypes.element.isRequired,
  },

  getInitialState: function () {
    return {
      // Stores the currently sorted collection as reflected by dragging,
      // Collection will be mutated on drag hover so the browser actually moves items
      collection: this.props.collection
    };
  },

  componentWillReceiveProps: function (nextProps) {
    // Once the onDrop callback is fired with the new collection
    // we need to re-set this collection to ultimately reflect the new order
    this.setState({collection: nextProps.collection});
  },

  render: function () {
    var children = this.state.collection.map(function (props, i) {
      var startingPosition = this.props.collection.indexOf(props);

      console.log("item: ", props.x, " startingPosition: ", startingPosition);
      console.log("item: ", props.x, " nextPosition: ", i);

      return (
        <SortableItem {...props} key={i} startingPosition={startingPosition} nextPosition={i}
          onHover={this._handleHover}
          onDrop={this._handleDrop}
          onCancel={this._handleCancel} >
          {this.props.children}
        </SortableItem>
      );
    }, this);

    return (
      <ul>{children}</ul>
    );
  },
  // Tracks hover states to modify interface to reflect current position hovered
  _handleHover: function (sourcePosition, targetPosition) {
    var source = this.state.collection[sourcePosition];

    this.setState(update(this.state, {
      collection: {$splice: [
        [sourcePosition, 1],
        [targetPosition, 0, source]
      ]}
    }));
  },

  // Handles the final callback to calling component to say "this is the new collection"
  _handleDrop: function () {
    if (this.props.collection !== this.state.collection) { // Dropped on yourself
      this.props.onSorted(this.state.collection);
    }
  },

  // If item is dropped outside a valid dropTarget, we cancel and reset
  _handleCancel: function () {
    this.setState({collection: this.props.collection});
  }
});

module.exports = DragDropContext(HTML5Backend)(SortableCollection);