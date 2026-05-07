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
      nResults: 10, // Default number of results
      fach: [],
      zyklus: [],
      results: [],
      isLoading: false, // Loading state
      hasSearched: false,
      searchError: '',
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

  search = (options = {}) => {
    const { silent = false } = options;
    const { queryText, querySchlagwort, nResults, fach, zyklus } = this.state;

    // Simple validation
    if (!queryText.trim()) {
      if (!silent) {
        alert('Please enter a search query.');
      }
      return;
    }

    console.log('Search Function started');
    this.setState({ isLoading: true, searchError: '' }); // Indicate loading state

    fetch("http://127.0.0.1:5000/search", {
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
        const documents = Array.isArray(data?.documents?.[0])
          ? data.documents[0]
          : Array.isArray(data?.documents)
            ? data.documents
            : [];
        const metadatas = Array.isArray(data?.metadatas?.[0])
          ? data.metadatas[0]
          : Array.isArray(data?.metadatas)
            ? data.metadatas
            : [];

        const results = documents.map((item, index) => {
          return {
            text: item,
            metadata: metadatas[index] || {}
          };
        });
        this.setState({
          results: results,
          isLoading: false,
          hasSearched: true,
          searchError: ''
        });
      })
      .catch((error) => {
        console.error('Error:', error);
        this.setState({
          isLoading: false,
          hasSearched: true,
          searchError: 'API nicht erreichbar oder Fehler bei der Suche.'
        });
      });
  }
  render() {
    const { queryText, querySchlagwort, nResults, fach, zyklus, results, isLoading, hasSearched, searchError } = this.state;

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
                placeholder="Um was geht es?"
                value={queryText}
              />
              <div className="Stichwort">
                <input
                  type="text"
                  id="querySchlagwort"
                  onChange={this.handleChange}
                  onKeyDown={this.handleKeyDown}
                  placeholder="Stichwort"
                  value={querySchlagwort}
                />
              </div>
              <button onClick={this.search}>Suche</button>
            </div>

            <div id="results">
              {/* Results list */}
              {isLoading && <p>Loading...</p>}
              {searchError && <p>{searchError}</p>}
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
              ) : hasSearched && !isLoading && !searchError ? (
                <p>Keine Ergebnisse gefunden.</p>
              ) : null}
            </div>
          </div>
          <div className="sidebar">


            <h3>Fach</h3>
            <Select
              id="fach"
              options={fachOptions}
              isMulti
              onChange={(selectedOptions) =>
                this.setState({ fach: selectedOptions.map(option => option.value) }, () => {
                  this.search({ silent: true }); // Call search after state update if query exists
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
                  this.search({ silent: true }); // Call search after state update if query exists
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

/* RESULTS INPUT
<input
                style={{ maxWidth: '60px', marginLeft: '10px' }} // Inline style for demonstration
                type="number"
                id="nResults"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                placeholder="#"
                value={nResults}
              />
*/