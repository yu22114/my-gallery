// .galleryにliが1つ以上あれば .empty を非表示にする
const gallery = document.querySelector('.gallery');
const empty = document.querySelector('.empty');

if (gallery && gallery.children.length > 0) {
  empty.style.display = 'none';
}
