clean:
	rm dist/*

dist/index.html: src/* doc/manual/QuerschnittsEditor.pdf
	npm update
	npm run build

doc/manual/QuerschnittsEditor.pdf: doc/manual/QuerschnittsEditor.tex
	pdflatex doc/manual/QuerschnittsEditor.tex

