// Importing modules
import SearchResult from './components/SearchResult';
import Select from 'react-select';
import React, { Component } from 'react';
import "./App.css";


const fachOptions = [
  { value: 'Italienisch', label: 'Italienisch' },
  { value: 'Französisch', label: 'Französisch' },
  { value: 'Englisch', label: 'Englisch' },
  { value: 'Latein', label: 'Latein' },
  { value: 'Deutsch', label: 'Deutsch' },
  { value: 'Bewegung und Sport', label: 'Bewegung und Sport' },
  { value: 'Natur, Mensch, Gesellschaft (1./2. Zyklus)', label: 'Natur, Mensch, Gesellschaft (1./2. Zyklus)' },
  { value: 'Ethik, Religionen, Gemeinschaft (mit Lebenskunde)', label: 'Ethik, Religionen, Gemeinschaft (mit Lebenskunde)' },
  { value: 'Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)', label: 'Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)' },
  { value: 'Natur und Technik (mit Physik, Chemie, Biologie)', label: 'Natur und Technik (mit Physik, Chemie, Biologie)' },
  { value: 'Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)', label: 'Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)' },
  { value: 'Medien und Informatik', label: 'Medien und Informatik' },
  { value: 'Musik', label: 'Musik' },
  { value: 'Bildnerisches Gestalten', label: 'Bildnerisches Gestalten' },
  { value: 'Textiles und Technisches Gestalten', label: 'Textiles und Technisches Gestalten' },
  { value: 'Mathematik', label: 'Mathematik' },
  { value: 'Berufliche Orientierung', label: 'Berufliche Orientierung' },
];

const zyklusOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: '',
      querySchlagwort: '',
      nResults: 5, // Default number of results
      fach: [],
      zyklus: [],
      results: [],
      isLoading: false, // Loading state
    };
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value
    });

  }

  handleSelectChange = (event) => {
    this.setState({
      [event.target.id]: Array.from(event.target.selectedOptions, option => option.value)
    });

  }

  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.search();
    }
  }

  search = () => {
    const { queryText, querySchlagwort, nResults, fach, zyklus } = this.state;

    // Simple validation
    if (!queryText.trim()) {
      alert('Please enter a search query.');
      return;
    }

    console.log('Search Function started');
    this.setState({ isLoading: true }); // Indicate loading state

    fetch("/search", { // Ensure this URL is correct for your setup
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_texts: queryText,
        querySchlagwort: querySchlagwort,
        n_results: Number(nResults),
        filters: {
          fach: fach,
          zyklus: zyklus,
        },
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log('Results: ' + response);
        return response.json();
      })
      .then(data => {
        const results = data.documents ? data.documents[0].map((item, index) => {
          return {
            text: item,
            metadata: data.metadatas[0][index]
          };
        }) : [];
        this.setState({
          results: results,
          isLoading: false
        });
      })
      .catch((error) => {
        console.error('Error:', error);
        this.setState({ isLoading: false });
      });
  }
  render() {
    const { queryText, querySchlagwort, nResults, fach, zyklus, results, isLoading } = this.state;

    return (
      <div className="app-container">




        <div className="content">

          <div className="main-content">
            <h2>KI basierte Suche im Lehrplan 21</h2>
            <div className="input-over-results">
              <input
                type="text"
                id="queryText"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                placeholder="Suchen"
                value={queryText}
              />
              <input
                style={{ maxWidth: '60px', marginLeft: '10px' }} // Inline style for demonstration
                type="number"
                id="nResults"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                placeholder="#"
                value={nResults}
              />
              <button onClick={this.search}>Suche</button>
            </div>

            <div id="results">
              {/* Results list */}
              {isLoading && <p>Loading...</p>}
              {results.length > 0 ? (
                results.map((result, index) =>
                  <SearchResult
                    key={index}
                    fach={result.metadata.fach}
                    zyklus={result.metadata.zyklus}
                    themenbereich={result.metadata.themenbereich}
                    code={result.metadata.code}
                    text={result.text}
                    url={result.metadata.url}
                  />
                )
              ) : !isLoading ? (
                <p>Keine Ergebnisse gefunden.</p>
              ) : null}
            </div>
          </div>
          <div className="sidebar">
            <h3>Stichwort</h3>
            <input
              type="text"
              id="querySchlagwort"
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              placeholder="Stichwort"
              value={querySchlagwort}
            />

            <h3>Fach</h3>
            <Select
              id="fach"
              options={fachOptions}
              isMulti
              onChange={(selectedOptions) =>
                this.setState({ fach: selectedOptions.map(option => option.value) }, () => {
                  this.search(); // Call search function after state is updated
                })
              }
              className="basic-multi-select"
              classNamePrefix="select"
            />

            <h3>Zyklus</h3>
            <Select
              id="zyklus"
              options={zyklusOptions}
              isMulti
              onChange={(selectedOptions) =>
                this.setState({ zyklus: selectedOptions.map(option => option.value) }, () => {
                  this.search(); // Call search function after state is updated
                })
              }
              className="basic-multi-select"
              classNamePrefix="select"
            />


          </div>

        </div>
      </div>
    );
  }
}






export default App;

