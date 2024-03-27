import React, { Component } from 'react';

class SearchResult extends Component {

    // Function to open the URL in a new tab
    handleOpenUrl = (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  
    render() {
      const { fach, zyklus, themenbereich, code, text, url } = this.props;
      return (
        <div className="result-item">
          <h3>{fach} - Zyklus: {zyklus}</h3>
          <p><strong>Themenbereich:</strong> {themenbereich}</p>
          <p><strong>Code: </strong>{code}</p>
          <p><strong>Kompetenz: </strong>{text}</p>
          {url && 
          <div className="web-view">
            <iframe src={url} width="900" height="120" title="view"></iframe>
            {/* Transparent overlay */}
            <div 
              className="click-overlay" 
              onClick={() => this.handleOpenUrl(url)} 
              role="button" 
              aria-label="Open web view in new tab"
            ></div>
          </div>}
        </div>
      );
    }
  }

export default SearchResult;