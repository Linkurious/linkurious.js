---
layout: full_page
title: ''
---

<center>
<h1>Linkurious.js</h1>
<h3>A Javascript toolkit to visualize and interact with graphs</h3>
<br/>
</center>

<div class='row'>

<div class="col-md-6">
<style> #graph { height: 400px; } </style>
<div id="graph" class="well" style="padding: 0"></div>
</div>
<div class="col-md-4">
<ul>
	<li>Pure javascript</li>
	<li>Fork of <a href="http://sigmajs.org/">sigma.js</a></li>
	<li>Canvas, webgl and svg renderers</li>
	<li>Lot of plugins</li>
</ul>
</div>

</div>
<script type="text/javascript">
sigma.parsers.gexf('examples/data/arctic.gexf', {
  container: 'graph'
});
</script>