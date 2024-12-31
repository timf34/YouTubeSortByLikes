# YouTube Sort By Likes

<p align="center"><i>Find the best quality videos from any channel! Like:View ratio is the best signal.</i></p>

<p align="center">
  <img src="assets/image.png" width="700" alt="Screenshot of YouTube Sort By Likes">
</p>


## API Usage

This project uses two APIs to fetch YouTube data:

1. **Invidious API (Primary)**: The app first attempts to use the Invidious API, which has no quota limitations. Multiple Invidious instances are supported with automatic fallback.

2. **YouTube Data API (Fallback)**: If Invidious API fails, the app falls back to the YouTube Data API which has a daily quota limit of 10,000 units. This is a hard limit that's difficult to increase - have to go through an audit with Google and submit documents, etc.

## To run locally 

1. Clone the repository:
```bash
git clone https://github.com/timf34/YouTubeSortByLikes.git
cd YouTubeSortByLikes
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
YOUTUBE_API_KEY=your_api_key_here  # Optional - only needed as fallback if Invidious fails
```

4. Run the development server:
```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



