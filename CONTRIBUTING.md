## Contributing

Thank you for considering contributing to MapTiler Geocoding Control package. It's people
like you that make it to great tool.

### Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/maptiler/maptiler-geocoding-control/issues/new/choose)! It's
generally best if you get confirmation of your bug or approval for your feature
request this way before starting to code.

If you have a general question about MapTiler Geocoding Control, you can reach out to the
[MapTiler documentation portal](https://documentation.maptiler.com/hc/en-us/search?query=geocoding)
or contact [our support](https://documentation.maptiler.com/hc/en-us/requests/new), the issue tracker is only for bugs and feature requests.

### Fork & create a branch

If this is something you think you can fix, then [create the fork](https://github.com/maptiler/maptiler-geocoding-control/fork) and create
a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-poi-filter
```

### Get the test suite running

Make sure you're using a recent version of NodeJS.

Install the development dependencies:

```sh
npm install
```

Then run the development mode, make sure, you export the [MapTiler Key](https://docs.maptiler.com/cloud/api/authentication-key/) as environment variable

```sh
VITE_API_KEY=YOUR_MAPTILER_API_KEY_HERE npm run dev
```

### Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help;
everyone is a beginner at first :smile_cat:

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's
up to date with MapTiler Geocoding Control main branch:

```sh
git remote add upstream git@github.com:maptiler/maptiler-geocoding-control.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-poi-filter
git rebase main
git push --set-upstream origin 325-add-poi-filter
```

Finally, go to GitHub and [make a Pull Request](https://github.com/maptiler/maptiler-geocoding-control/compare)

## Final word

Thank you one more time for your contribution. We try to deliver best user experience of geocoding, your contribution
will make better experience to all users!
